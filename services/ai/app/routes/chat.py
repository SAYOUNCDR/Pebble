import json
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.llm.dmr_client import DMRClient
from app.models.schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    ChatSuggestedChecklistPayload,
    IngestRequest,
)
from app.pipeline.common import index_path, manual_path, read_json
from app.pipeline.ingest.ingest_service import ingest_manual

router = APIRouter(prefix="/v1", tags=["chat"])


def _extract_json_payload(text: str) -> dict[str, object] | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        payload = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def _score_section(message: str, section: dict[str, object]) -> int:
    haystack = f"{section.get('title', '')} {section.get('summary', '')}".lower()
    score = 0
    for term in re.findall(r"[a-z0-9]{3,}", message.lower()):
        if term in haystack:
            score += 2
    for keyword in (
        "warning",
        "safety",
        "inspect",
        "check",
        "maintenance",
        "procedure",
        "replace",
    ):
        if keyword in haystack:
            score += 1
    return score


def _build_sections(
    manual_data: dict[str, object], index_data: dict[str, object] | None
) -> list[dict[str, object]]:
    sections = index_data.get("sections") if index_data else None
    if isinstance(sections, list):
        indexed_sections = [
            section for section in sections if isinstance(section, dict)
        ]
        if indexed_sections:
            return indexed_sections

    pages = manual_data.get("pages")
    if not isinstance(pages, list) or not pages:
        return []

    fallback_sections: list[dict[str, object]] = []
    chunk_size = 3
    for idx, start in enumerate(range(0, len(pages), chunk_size), start=1):
        chunk = pages[start : start + chunk_size]
        first_page = chunk[0] if chunk else {}
        last_page = chunk[-1] if chunk else {}
        page_start = (
            int(first_page.get("page_number", start + 1))
            if isinstance(first_page, dict)
            else start + 1
        )
        page_end = (
            int(last_page.get("page_number", page_start))
            if isinstance(last_page, dict)
            else page_start
        )
        summary = " ".join(
            str(page.get("text", "")).strip()[:220]
            for page in chunk
            if isinstance(page, dict) and str(page.get("text", "")).strip()
        )
        fallback_sections.append(
            {
                "section_id": f"sec-{idx:03d}",
                "title": f"Pages {page_start}-{page_end}",
                "page_start": page_start,
                "page_end": page_end,
                "summary": summary[:900],
            }
        )

    return fallback_sections


def _pick_sections(
    message: str, sections: list[dict[str, object]], limit: int = 5
) -> list[dict[str, object]]:
    ranked = sorted(
        sections, key=lambda section: _score_section(message, section), reverse=True
    )
    selected = ranked[:limit]
    return selected if selected else sections[:limit]


def _build_context(manual_name: str, sections: list[dict[str, object]]) -> str:
    if not sections:
        return f"Manual name: {manual_name}\nNo section index was available."

    lines = [f"Manual name: {manual_name}", "Relevant sections:"]
    for section in sections:
        lines.append(
            f"- {section.get('section_id', '')} | {section.get('title', '')} | pages {section.get('page_start', '?')}-{section.get('page_end', '?')} | {str(section.get('summary', '')).strip()[:240]}"
        )
    return "\n".join(lines)


def _build_history_block(chat_history: list[dict[str, str]]) -> str:
    if not chat_history:
        return "No prior conversation."

    lines = ["Prior conversation:"]
    for item in chat_history[-12:]:
        role = str(item.get("role", "user")).strip() or "user"
        content = str(item.get("content", "")).strip()
        if content:
            lines.append(f"- {role}: {content}")
    return "\n".join(lines)


def _fallback_reply(
    manual_name: str, message: str, sections: list[dict[str, object]]
) -> str:
    assistant_intro = (
        "I’m Pebble, your manual helper for checklist planning and manual Q&A.\n"
        "I can help with maintenance manuals, service guides, and technical walkthroughs.\n\n"
    )
    section_titles = [
        str(section.get("title", "")).strip()
        for section in sections[:3]
        if str(section.get("title", "")).strip()
    ]
    if "checklist" in message.lower() or "generate" in message.lower():
        if section_titles:
            return (
                assistant_intro + "Summary:\n"
                f'I can help generate a checklist for "{manual_name}".\n\n'
                "Key sections:\n"
                + "\n".join(f"- {title}" for title in section_titles)
                + "\n\nNext step:\nUse New Checklist to create a structured version from these sections."
            )
        return (
            assistant_intro + "Summary:\n"
            f'I can help generate a checklist for "{manual_name}".\n\n'
            "Next step:\nUse the New Checklist button to build one from the manual."
        )

    if section_titles:
        return (
            assistant_intro + "Summary:\n"
            f'I found relevant sections in "{manual_name}".\n\n'
            "Relevant sections:\n"
            + "\n".join(f"- {title}" for title in section_titles)
            + "\n\nNext step:\nAsk a more specific question and I’ll focus on the matching section."
        )

    return (
        assistant_intro + "Summary:\n"
        f'I’m looking at "{manual_name}", but I could not find a direct manual citation for that request.\n\n'
        "General guidance:\n"
        "- I can still give you a practical manual-based answer based on common field practice.\n"
        "- If you want the strict manual-backed version, ask a more specific question or point me to a section.\n\n"
        "Next step:\nAsk me for a checklist, a quick explanation, or a general best-practice answer."
    )


def _suggested_checklist_payload(message: str) -> ChatSuggestedChecklistPayload | None:
    lower_message = message.lower()
    if (
        "checklist" not in lower_message
        and "generate" not in lower_message
        and "list" not in lower_message
    ):
        return None

    objective = "Generate a practical checklist based on the manual."
    checklist_name = "Checklist"
    if "safety" in lower_message:
        objective = "Generate a safety compliance checklist."
        checklist_name = "Safety Compliance Checklist"
    elif "operations" in lower_message:
        objective = "Generate an operations checklist."
        checklist_name = "Operations Checklist"
    elif "maintenance" in lower_message:
        objective = "Generate a maintenance checklist."
        checklist_name = "Maintenance Checklist"

    return ChatSuggestedChecklistPayload(
        objective=objective,
        checklist_name=checklist_name,
        max_items=20,
        provider="local",
        retrieval_mode="heuristic",
        strict_citations=True,
    )


def _normalize_suggested_payload(
    payload: dict[str, object] | None,
) -> ChatSuggestedChecklistPayload | None:
    if not isinstance(payload, dict):
        return None

    try:
        return ChatSuggestedChecklistPayload.model_validate(payload)
    except Exception:
        pass

    # Support camelCase variants if model ignores the required snake_case schema.
    try:
        if "objective" in payload:
            return ChatSuggestedChecklistPayload.model_validate(
                {
                    "checklist_name": payload.get("checklistName"),
                    "objective": payload.get("objective"),
                    "max_items": payload.get("maxItems", 20),
                    "provider": payload.get("provider", "local"),
                    "retrieval_mode": payload.get("retrievalMode", "heuristic"),
                    "strict_citations": payload.get("strictCitations", True),
                }
            )
    except Exception:
        pass

    # Handle malformed suggestion blocks such as {"Checklist_Suggestions": [...]}.
    raw_suggestions = payload.get("Checklist_Suggestions")
    if isinstance(raw_suggestions, list) and raw_suggestions:
        first = raw_suggestions[0]
        if isinstance(first, dict):
            raw_name = str(first.get("Name", "")).strip()
            checklist_name = raw_name or "Checklist"
            return ChatSuggestedChecklistPayload(
                checklist_name=checklist_name,
                objective=f"Generate a practical checklist for {checklist_name}.",
                max_items=20,
                provider="local",
                retrieval_mode="heuristic",
                strict_citations=True,
            )

    return None


async def _ensure_manual_ingested(
    payload: ChatQueryRequest,
) -> tuple[dict[str, object], str]:
    manual_file = manual_path(payload.manual_id)
    if manual_file.exists():
        manual_data = read_json(manual_file)
        manual_name = str(
            manual_data.get("manual_name", payload.manual_name or payload.manual_id)
        )
        return manual_data, manual_name

    if not payload.file_path:
        raise HTTPException(status_code=404, detail="Manual has not been ingested yet.")

    ingest_payload = IngestRequest(
        manual_id=payload.manual_id,
        file_path=payload.file_path,
        manual_name=payload.manual_name,
    )
    ingest_manual(ingest_payload)
    manual_data = read_json(manual_file)
    manual_name = str(
        manual_data.get("manual_name", payload.manual_name or payload.manual_id)
    )
    return manual_data, manual_name


@router.post("/chat/query", response_model=ChatQueryResponse)
async def query_chat(payload: ChatQueryRequest) -> ChatQueryResponse:
    try:
        manual_data, manual_name = await _ensure_manual_ingested(payload)
        index_data = None
        try:
            index_data = read_json(index_path(payload.manual_id))
        except FileNotFoundError:
            index_data = None

        sections = _build_sections(manual_data=manual_data, index_data=index_data)
        selected_sections = _pick_sections(payload.message, sections, limit=5)
        context = _build_context(manual_name, selected_sections)
        history_block = _build_history_block(payload.chat_history)

        dmr_client = DMRClient()
        model_output: str | None = None
        try:
            model_output = await dmr_client.chat(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are Pebble, a polished manual helper for checklist planning and Q&A. "
                            "You support maintenance manuals, service guides, and technical handbooks, not just maintenance teams. "
                            "Use the provided context first, but if the manual does not contain enough detail, provide a short general-guidance answer and clearly label it as general guidance. "
                            "Use prior conversation as context so follow-up questions stay connected. "
                            "Return valid JSON with keys reply and suggested_checklist_payload. "
                            "suggested_checklist_payload must be either null or a single object with keys: checklist_name, objective, max_items, provider, retrieval_mode, strict_citations. "
                            "Do not return arrays, nested suggestion collections, or custom keys such as Checklist_Suggestions. "
                            "The reply value must be plain text with short headings, blank lines, and bullet points or numbered lists. "
                            "Do not use markdown bold markers, markdown tables, or asterisks for emphasis. "
                            "Keep the answer concise, readable, confident, and a little cool."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Question: {payload.message}\n\nContext:\n{context}\n\n{history_block}",
                    },
                ],
                temperature=0.2,
            )
        except Exception:
            model_output = None

        reply = _fallback_reply(manual_name, payload.message, selected_sections)
        suggested_payload = _suggested_checklist_payload(payload.message)

        if model_output:
            parsed = _extract_json_payload(model_output)
            if parsed:
                parsed_reply = parsed.get("reply")
                if isinstance(parsed_reply, str) and parsed_reply.strip():
                    reply = parsed_reply.strip()

                parsed_suggestion = parsed.get("suggested_checklist_payload")
                if isinstance(parsed_suggestion, dict):
                    normalized = _normalize_suggested_payload(parsed_suggestion)
                    if normalized is not None:
                        suggested_payload = normalized
                elif suggested_payload is None and isinstance(
                    parsed.get("suggestedChecklistPayload"), dict
                ):
                    normalized = _normalize_suggested_payload(
                        parsed["suggestedChecklistPayload"]
                    )
                    if normalized is not None:
                        suggested_payload = normalized
            elif isinstance(model_output, str) and model_output.strip():
                reply = model_output.strip()

        return ChatQueryResponse(
            manual_id=payload.manual_id,
            reply=reply,
            suggested_checklist_payload=suggested_payload,
        )
    except HTTPException:
        raise
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
