from datetime import datetime, UTC

from app.models.schemas import ChecklistItem, RejectedItem, VerifyChecklistRequest, VerifyChecklistResponse
from app.pipeline.common import checklist_path, read_json, verified_checklist_path, write_json


def _normalize_text(text: str) -> str:
    return " ".join(text.strip().lower().split())


def _load_items_from_payload(payload: VerifyChecklistRequest) -> tuple[str | None, list[ChecklistItem]]:
    if payload.items:
        return payload.checklist_id, payload.items

    if not payload.checklist_id:
        raise ValueError("Provide either checklist_id or items for verification.")

    checklist_data = read_json(checklist_path(payload.checklist_id))
    raw_items = checklist_data.get("items", [])
    if not isinstance(raw_items, list):
        raise ValueError("Stored checklist items are invalid.")
    return payload.checklist_id, [ChecklistItem(**item) for item in raw_items]


def verify_checklist(payload: VerifyChecklistRequest) -> VerifyChecklistResponse:
    checklist_id, items = _load_items_from_payload(payload)

    accepted_items: list[ChecklistItem] = []
    rejected_items: list[RejectedItem] = []
    seen_fingerprints: set[str] = set()

    for item in items:
        fingerprint = f"{_normalize_text(item.text)}|{item.evidence.page_number}"
        if fingerprint in seen_fingerprints:
            rejected_items.append(RejectedItem(text=item.text, reason="duplicate_item"))
            continue

        seen_fingerprints.add(fingerprint)

        if payload.strict_citations:
            evidence = item.evidence
            if (
                not evidence.manual_id.strip()
                or not evidence.section_id.strip()
                or evidence.page_number <= 0
                or not evidence.excerpt.strip()
            ):
                rejected_items.append(RejectedItem(text=item.text, reason="missing_strict_citation"))
                continue

        if item.confidence < 0.15:
            rejected_items.append(RejectedItem(text=item.text, reason="low_confidence"))
            continue

        accepted_items.append(item)

    if checklist_id:
        verification_doc: dict[str, object] = {
            "checklist_id": checklist_id,
            "manual_id": payload.manual_id,
            "verified_at": datetime.now(UTC).isoformat(),
            "strict_citations": payload.strict_citations,
            "accepted_items": [item.model_dump() for item in accepted_items],
            "rejected_items": [item.model_dump() for item in rejected_items],
            "accepted_count": len(accepted_items),
            "rejected_count": len(rejected_items),
        }
        write_json(verified_checklist_path(checklist_id), verification_doc)

    return VerifyChecklistResponse(
        manual_id=payload.manual_id,
        checklist_id=checklist_id,
        accepted_count=len(accepted_items),
        rejected_count=len(rejected_items),
        accepted_items=accepted_items,
        rejected_items=rejected_items,
        status="verified",
    )

