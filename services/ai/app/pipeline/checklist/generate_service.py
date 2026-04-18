import json
from datetime import datetime, UTC
from uuid import uuid4

from app.config import settings
from app.llm.dmr_client import DMRClient
from app.models.schemas import (
    ChecklistItem,
    GenerateChecklistRequest,
    GenerateChecklistResponse,
)
from app.pipeline.common import (
    checklist_path,
    index_path,
    manual_path,
    pageindex_tree_path,
    read_json,
    write_json,
)
from app.pipeline.pageindex.tree_search import llm_tree_search, tree_nodes_to_sections


def _normalize_priority(value: str) -> str:
    cleaned = value.strip().lower()
    if cleaned in {"must", "must_do", "required", "critical"}:
        return "must_do"
    return "optional"


def _normalize_frequency(value: str) -> str:
    cleaned = value.strip().lower()
    known = {
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
        "before_operation",
        "as_needed",
    }
    return cleaned if cleaned in known else "as_needed"


def _normalize_safety(value: str) -> str:
    cleaned = value.strip().lower()
    return "safety" if cleaned in {"safety", "warning", "hazard"} else "standard"


def _clamp_confidence(value: float) -> float:
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return round(value, 3)


def _score_section(section: dict[str, object]) -> int:
    title = str(section.get("title", "")).lower()
    summary = str(section.get("summary", "")).lower()
    haystack = f"{title} {summary}"
    score = 0
    for keyword in (
        "maintenance",
        "inspect",
        "inspection",
        "check",
        "replace",
        "service",
        "safety",
        "warning",
    ):
        if keyword in haystack:
            score += 2
    if "procedure" in haystack or "step" in haystack:
        score += 1
    return score


def _pick_candidate_sections(
    sections: list[dict[str, object]], limit: int = 8
) -> list[dict[str, object]]:
    scored = sorted(sections, key=_score_section, reverse=True)
    candidates = scored[:limit]
    return candidates if candidates else sections[:limit]


def _sections_to_tree_nodes(
    sections: list[dict[str, object]],
) -> list[dict[str, object]]:
    tree_nodes: list[dict[str, object]] = []
    for section in sections:
        tree_nodes.append(
            {
                "node_id": str(section.get("section_id", "")),
                "title": str(section.get("title", "")),
                "page_index": int(section.get("page_start", 1)),
                "text": str(section.get("summary", "")),
                "nodes": [],
            }
        )
    return tree_nodes


def _build_prompt(
    manual_name: str, objective: str, sections: list[dict[str, object]], max_items: int
) -> str:
    section_block = "\n".join(
        f"- {section['section_id']} | {section['title']} | pages {section['page_start']}-{section['page_end']} | {section['summary'][:220]}"
        for section in sections
    )
    return (
        "You are a maintenance checklist generator.\n"
        f"Manual name: {manual_name}\n"
        f"Objective: {objective}\n"
        f"Max items: {max_items}\n"
        "Return a checklist_name along with the items.\n"
        "Use only the evidence from provided sections.\n"
        "Return only valid JSON in this shape:\n"
        '{"checklist_name":"...","items":[{"text":"...","priority":"must_do|optional","frequency":"daily|weekly|monthly|before_operation|as_needed","safety_tag":"safety|standard","confidence":0.0,"section_id":"sec-001","page_number":1,"excerpt":"..."}]}\n'
        "Candidate sections:\n"
        f"{section_block}"
    )


def _default_checklist_name(
    manual_name: str, objective: str, requested_name: str | None = None
) -> str:
    if requested_name and requested_name.strip():
        return requested_name.strip()

    lower_objective = objective.lower()
    if "safety" in lower_objective:
        return "Safety Compliance Checklist"
    if "operations" in lower_objective:
        return "Operations Checklist"
    if "maintenance" in lower_objective:
        return "Maintenance Checklist"

    base_name = manual_name.strip() if manual_name.strip() else "Checklist"
    return f"{base_name} Checklist"


def _extract_json_payload(text: str) -> dict[str, object] | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = text[start : end + 1]
    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def _fallback_items(
    manual_id: str,
    sections: list[dict[str, object]],
    max_items: int,
) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for section in sections[:max_items]:
        title = str(section.get("title", "maintenance task"))
        excerpt = str(section.get("summary", "")).strip()[:220]
        page_start = int(section.get("page_start", 1))
        lowered = title.lower()
        priority = (
            "must_do"
            if any(key in lowered for key in ("safety", "warning", "inspect", "check"))
            else "optional"
        )
        frequency = (
            "monthly" if "replace" in lowered or "service" in lowered else "weekly"
        )
        safety_tag = (
            "safety" if "safety" in lowered or "warning" in lowered else "standard"
        )
        items.append(
            {
                "text": f"Review and execute: {title}",
                "priority": priority,
                "frequency": frequency,
                "safety_tag": safety_tag,
                "confidence": 0.6,
                "section_id": str(section.get("section_id", "sec-unknown")),
                "page_number": page_start,
                "excerpt": excerpt or f"Derived from section '{title}'.",
                "manual_id": manual_id,
            }
        )
    return items


def _coerce_llm_items(
    manual_id: str,
    sections: list[dict[str, object]],
    llm_items: list[dict[str, object]],
    max_items: int,
) -> list[ChecklistItem]:
    sections_by_id = {str(section["section_id"]): section for section in sections}
    ordered_sections = sections[: max(1, min(len(sections), max_items))]

    checklist: list[ChecklistItem] = []
    for index, raw in enumerate(llm_items[:max_items], start=1):
        section_id = str(raw.get("section_id", "")).strip()
        section = sections_by_id.get(section_id)
        if not section:
            section = ordered_sections[(index - 1) % len(ordered_sections)]
            section_id = str(section["section_id"])

        page_number = int(raw.get("page_number", section.get("page_start", 1)))
        page_start = int(section.get("page_start", 1))
        page_end = int(section.get("page_end", page_start))
        if page_number < page_start or page_number > page_end:
            page_number = page_start

        excerpt = (
            str(raw.get("excerpt", "")).strip()
            or str(section.get("summary", "")).strip()[:220]
        )
        if not excerpt:
            excerpt = f"Evidence from {section.get('title', 'manual section')}."

        text = (
            str(raw.get("text", "")).strip()
            or f"Review section: {section.get('title', 'manual section')}"
        )
        checklist.append(
            ChecklistItem(
                item_id=f"item-{uuid4().hex[:10]}",
                text=text,
                priority=_normalize_priority(str(raw.get("priority", "optional"))),  # type: ignore[arg-type]
                frequency=_normalize_frequency(str(raw.get("frequency", "as_needed"))),
                safety_tag=_normalize_safety(str(raw.get("safety_tag", "standard"))),
                confidence=_clamp_confidence(float(raw.get("confidence", 0.5))),
                evidence={
                    "manual_id": manual_id,
                    "section_id": section_id,
                    "page_number": page_number,
                    "excerpt": excerpt,
                },
            )
        )
    return checklist


def _safe_json_parse(text: str) -> list[dict[str, object]]:
    payload = _extract_json_payload(text)
    if not payload:
        return []
    items = payload.get("items")
    if not isinstance(items, list):
        return []
    clean_items: list[dict[str, object]] = []
    for item in items:
        if isinstance(item, dict):
            clean_items.append(item)
    return clean_items


async def generate_checklist(
    payload: GenerateChecklistRequest,
) -> GenerateChecklistResponse:
    manual_data = read_json(manual_path(payload.manual_id))
    index_data = read_json(index_path(payload.manual_id))
    manual_name = str(manual_data.get("manual_name", payload.manual_id))
    checklist_name = _default_checklist_name(
        manual_name, payload.objective, payload.checklist_name
    )

    sections = index_data.get("sections")
    if not isinstance(sections, list) or not sections:
        raise ValueError("Manual index not found. Run /v1/pageindex/build first.")

    retrieval_mode = payload.retrieval_mode
    selected_node_ids: list[str] = []
    candidate_sections: list[dict[str, object]]

    if retrieval_mode == "tree_search":
        tree_nodes: list[dict[str, object]] = []
        try:
            tree_doc = read_json(pageindex_tree_path(payload.manual_id))
            raw_tree = tree_doc.get("tree", [])
            if isinstance(raw_tree, list):
                tree_nodes = raw_tree
        except FileNotFoundError:
            tree_nodes = []

        if not tree_nodes:
            tree_nodes = _sections_to_tree_nodes(sections=sections)

        selected_node_ids, routing_note = await llm_tree_search(
            objective=payload.objective,
            tree_nodes=tree_nodes,
            max_nodes=min(max(payload.max_items, 1), 12),
            expert_rules=payload.expert_rules,
        )
        candidate_sections = tree_nodes_to_sections(
            tree_nodes=tree_nodes, node_ids=selected_node_ids
        )
        if not candidate_sections:
            candidate_sections = _pick_candidate_sections(sections=sections, limit=10)
            selected_node_ids = [
                str(section.get("section_id", "")) for section in candidate_sections
            ]
            warnings_seed = (
                "Tree search returned no section candidates. Heuristic fallback used."
            )
        else:
            warnings_seed = f"Tree search routing note: {routing_note}"
    else:
        candidate_sections = _pick_candidate_sections(sections=sections, limit=10)
        selected_node_ids = [
            str(section.get("section_id", "")) for section in candidate_sections
        ]
        warnings_seed = ""

    strict_citations = (
        payload.strict_citations
        if payload.strict_citations is not None
        else settings.strict_citations_default
    )

    prompt = _build_prompt(
        manual_name=manual_name,
        objective=payload.objective,
        sections=candidate_sections,
        max_items=payload.max_items,
    )

    warnings: list[str] = [warnings_seed] if warnings_seed else []
    generated_raw_items: list[dict[str, object]] = []
    dmr_client = DMRClient()

    try:
        model_output = await dmr_client.chat(
            messages=[
                {
                    "role": "system",
                    "content": "Return strictly valid JSON with checklist items.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )
        generated_raw_items = _safe_json_parse(model_output)
        if not generated_raw_items:
            warnings.append(
                "LLM response was not valid JSON. Fallback generation used."
            )
    except Exception as error:  # noqa: BLE001
        warnings.append(f"DMR call failed. Fallback generation used. Reason: {error}")

    if not generated_raw_items:
        generated_raw_items = _fallback_items(
            manual_id=payload.manual_id,
            sections=candidate_sections,
            max_items=min(payload.max_items, len(candidate_sections)),
        )

    checklist_items = _coerce_llm_items(
        manual_id=payload.manual_id,
        sections=candidate_sections,
        llm_items=generated_raw_items,
        max_items=payload.max_items,
    )

    if strict_citations:
        checklist_items = [
            item for item in checklist_items if item.evidence.excerpt.strip()
        ]

    checklist_id = f"chk-{uuid4().hex[:12]}"
    checklist_doc: dict[str, object] = {
        "manual_id": payload.manual_id,
        "checklist_id": checklist_id,
        "checklist_name": checklist_name,
        "created_at": datetime.now(UTC).isoformat(),
        "strict_citations": strict_citations,
        "objective": payload.objective,
        "retrieval_mode": retrieval_mode,
        "selected_node_ids": selected_node_ids,
        "items": [item.model_dump() for item in checklist_items],
        "warnings": warnings,
    }
    write_json(checklist_path(checklist_id), checklist_doc)

    return GenerateChecklistResponse(
        manual_id=payload.manual_id,
        checklist_id=checklist_id,
        checklist_name=checklist_name,
        item_count=len(checklist_items),
        items=checklist_items,
        warnings=warnings,
        retrieval_mode=retrieval_mode,
        selected_node_ids=selected_node_ids,
        status="generated",
    )
