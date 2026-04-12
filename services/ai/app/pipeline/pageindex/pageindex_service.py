import re
from datetime import datetime, UTC
from pathlib import Path

from app.config import settings
from app.models.schemas import BuildIndexRequest, BuildIndexResponse, SectionOutline
from app.pipeline.common import (
    index_path,
    manual_path,
    pageindex_doc_path,
    pageindex_tree_path,
    read_json,
    write_json,
)
from app.pipeline.pageindex.pageindex_api_client import PageIndexAPIClient


def _clean_line(text: str) -> str:
    return " ".join(text.strip().split())


def _looks_like_heading(line: str) -> bool:
    cleaned = _clean_line(line)
    if len(cleaned) < 4 or len(cleaned) > 90:
        return False
    if cleaned.endswith("."):
        return False

    numbered_heading = bool(re.match(r"^\d+(\.\d+)*\s+\S+", cleaned))
    uppercase_ratio = sum(1 for char in cleaned if char.isupper()) / max(
        1, sum(1 for char in cleaned if char.isalpha())
    )
    mostly_uppercase = uppercase_ratio >= 0.65
    title_case_like = cleaned[:1].isupper() and cleaned.count(" ") <= 8
    return numbered_heading or mostly_uppercase or title_case_like


def _extract_page_heading(page_text: str) -> str | None:
    for raw_line in page_text.splitlines()[:24]:
        line = _clean_line(raw_line)
        if line and _looks_like_heading(line):
            return line
    return None


def _fixed_chunks(page_count: int, chunk_size: int) -> list[tuple[str, int]]:
    chunks: list[tuple[str, int]] = []
    section_number = 1
    for page_start in range(1, page_count + 1, chunk_size):
        page_end = min(page_start + chunk_size - 1, page_count)
        chunks.append((f"Section {section_number} (Pages {page_start}-{page_end})", page_start))
        section_number += 1
    return chunks


def _collect_excerpt(pages: list[dict[str, object]], start_page: int, end_page: int) -> str:
    snippets: list[str] = []
    for page_number in range(start_page, end_page + 1):
        page = pages[page_number - 1]
        text = str(page.get("text", "")).strip()
        if text:
            snippets.append(text[:350])
        if len(" ".join(snippets)) > 800:
            break
    return " ".join(snippets)[:900]


def _build_local_sections(manual_data: dict[str, object], chunk_size_pages: int) -> list[dict[str, object]]:
    pages = manual_data.get("pages")
    if not isinstance(pages, list) or not pages:
        raise ValueError("Manual has no parsed pages. Run /v1/ingest first.")

    heading_points: list[tuple[str, int]] = []
    for page in pages:
        page_number = int(page.get("page_number", 0))
        page_text = str(page.get("text", ""))
        heading = _extract_page_heading(page_text)
        if page_number > 0 and heading:
            heading_points.append((heading, page_number))

    deduped: list[tuple[str, int]] = []
    seen_pages: set[int] = set()
    for title, page_number in heading_points:
        if page_number not in seen_pages:
            deduped.append((title, page_number))
            seen_pages.add(page_number)

    page_count = int(manual_data.get("page_count", len(pages)))
    if not deduped:
        deduped = _fixed_chunks(page_count=page_count, chunk_size=chunk_size_pages)

    sections: list[dict[str, object]] = []
    for idx, (title, page_start) in enumerate(deduped, start=1):
        next_start = deduped[idx][1] if idx < len(deduped) else page_count + 1
        page_end = max(page_start, next_start - 1)
        summary = _collect_excerpt(pages, page_start, page_end)
        sections.append(
            {
                "section_id": f"sec-{idx:03d}",
                "title": title,
                "page_start": page_start,
                "page_end": page_end,
                "summary": summary,
            }
        )
    return sections


def _flatten_tree_nodes(nodes: list[dict[str, object]]) -> list[dict[str, object]]:
    flat: list[dict[str, object]] = []
    for node in nodes:
        node_id = str(node.get("node_id", "")).strip()
        title = str(node.get("title", "")).strip()
        page_index = int(node.get("page_index", 1))
        text = str(node.get("text", node.get("summary", ""))).strip()
        children_raw = node.get("nodes", [])
        children = children_raw if isinstance(children_raw, list) else []

        flat.append(
            {
                "section_id": node_id or f"node-{len(flat)+1:04d}",
                "title": title or "Untitled Section",
                "page_start": page_index,
                "page_end": page_index,
                "summary": text[:900],
            }
        )
        flat.extend(_flatten_tree_nodes(children))
    return flat


def _count_tree_nodes(nodes: list[dict[str, object]]) -> int:
    total = 0
    for node in nodes:
        total += 1
        children_raw = node.get("nodes", [])
        children = children_raw if isinstance(children_raw, list) else []
        total += _count_tree_nodes(children)
    return total


async def _build_from_pageindex(payload: BuildIndexRequest, manual_data: dict[str, object]) -> BuildIndexResponse:
    source_path_raw = str(manual_data.get("source_path", "")).strip()
    if not source_path_raw:
        raise ValueError("Manual source path missing. Run /v1/ingest first.")

    source_path = Path(source_path_raw)
    if not source_path.exists():
        raise FileNotFoundError(f"Manual source file does not exist: {source_path}")

    client = PageIndexAPIClient()
    doc_info: dict[str, object] = {}
    doc_info_path = pageindex_doc_path(payload.manual_id)

    if not payload.force_rebuild:
        try:
            doc_info = read_json(doc_info_path)
        except FileNotFoundError:
            doc_info = {}

    doc_id = str(doc_info.get("doc_id", "")).strip()
    if not doc_id:
        doc_id = await client.submit_document(source_path)
        doc_info = {
            "manual_id": payload.manual_id,
            "doc_id": doc_id,
            "source_path": str(source_path),
            "submitted_at": datetime.now(UTC).isoformat(),
        }
        write_json(doc_info_path, doc_info)

    deadline = datetime.now(UTC).timestamp() + settings.pageindex_poll_timeout_seconds
    tree_payload: dict[str, object] | None = None

    while datetime.now(UTC).timestamp() < deadline:
        status_payload = await client.get_document(doc_id=doc_id, result_type="tree", summary=True)
        status = str(status_payload.get("status", "")).lower()
        if status == "completed":
            tree_payload = status_payload
            break
        if status == "failed":
            raise ValueError("PageIndex tree generation failed for this document.")
        await __import__("asyncio").sleep(settings.pageindex_poll_interval_seconds)

    if tree_payload is None:
        raise TimeoutError("Timed out waiting for PageIndex tree generation.")

    tree_result = tree_payload.get("result", [])
    if not isinstance(tree_result, list) or not tree_result:
        raise ValueError("PageIndex returned an empty tree result.")

    sections = _flatten_tree_nodes(tree_result)
    tree_node_count = _count_tree_nodes(tree_result)

    index_doc: dict[str, object] = {
        "manual_id": payload.manual_id,
        "manual_name": manual_data.get("manual_name", payload.manual_id),
        "provider": "pageindex",
        "doc_id": doc_id,
        "built_at": datetime.now(UTC).isoformat(),
        "section_count": len(sections),
        "tree_node_count": tree_node_count,
        "sections": sections,
    }
    write_json(index_path(payload.manual_id), index_doc)
    write_json(
        pageindex_tree_path(payload.manual_id),
        {
            "manual_id": payload.manual_id,
            "doc_id": doc_id,
            "fetched_at": datetime.now(UTC).isoformat(),
            "tree": tree_result,
        },
    )

    return BuildIndexResponse(
        manual_id=payload.manual_id,
        section_count=len(sections),
        sections=[SectionOutline(**section) for section in sections],
        provider="pageindex",
        doc_id=doc_id,
        tree_node_count=tree_node_count,
        status="indexed",
    )


async def build_pageindex(payload: BuildIndexRequest) -> BuildIndexResponse:
    manual_data = read_json(manual_path(payload.manual_id))

    if payload.provider == "pageindex":
        return await _build_from_pageindex(payload=payload, manual_data=manual_data)

    sections = _build_local_sections(manual_data=manual_data, chunk_size_pages=payload.chunk_size_pages)
    index_doc: dict[str, object] = {
        "manual_id": payload.manual_id,
        "manual_name": manual_data.get("manual_name", payload.manual_id),
        "provider": "local",
        "built_at": datetime.now(UTC).isoformat(),
        "section_count": len(sections),
        "sections": sections,
    }
    write_json(index_path(payload.manual_id), index_doc)

    return BuildIndexResponse(
        manual_id=payload.manual_id,
        section_count=len(sections),
        sections=[SectionOutline(**section) for section in sections],
        provider="local",
        status="indexed",
    )
