import re
from datetime import datetime, UTC

from app.models.schemas import BuildIndexRequest, BuildIndexResponse, SectionOutline
from app.pipeline.common import index_path, manual_path, read_json, write_json


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


def build_pageindex(payload: BuildIndexRequest) -> BuildIndexResponse:
    manual_data = read_json(manual_path(payload.manual_id))
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
        deduped = _fixed_chunks(page_count=page_count, chunk_size=payload.chunk_size_pages)

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

    index_doc: dict[str, object] = {
        "manual_id": payload.manual_id,
        "manual_name": manual_data.get("manual_name", payload.manual_id),
        "built_at": datetime.now(UTC).isoformat(),
        "section_count": len(sections),
        "sections": sections,
    }
    write_json(index_path(payload.manual_id), index_doc)

    response_sections = [SectionOutline(**section) for section in sections]
    return BuildIndexResponse(
        manual_id=payload.manual_id,
        section_count=len(response_sections),
        sections=response_sections,
        status="indexed",
    )

