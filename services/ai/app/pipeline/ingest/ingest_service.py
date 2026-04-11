from datetime import datetime, UTC
from pathlib import Path

import fitz

from app.models.schemas import IngestRequest, IngestResponse
from app.pipeline.common import manual_path, write_json


def ingest_manual(payload: IngestRequest) -> IngestResponse:
    source_path = Path(payload.file_path).expanduser()
    if not source_path.is_absolute():
        source_path = (Path.cwd() / source_path).resolve()

    if not source_path.exists():
        raise FileNotFoundError(f"Manual file not found at '{source_path}'.")
    if source_path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF input is supported in v1.")

    pages: list[dict[str, object]] = []
    word_count = 0

    with fitz.open(source_path) as document:
        for page_index, page in enumerate(document, start=1):
            page_text = (page.get_text("text") or "").strip()
            page_words = len(page_text.split())
            word_count += page_words
            pages.append(
                {
                    "page_number": page_index,
                    "text": page_text,
                    "word_count": page_words,
                }
            )

    manual_data: dict[str, object] = {
        "manual_id": payload.manual_id,
        "manual_name": payload.manual_name or source_path.stem,
        "source_path": str(source_path),
        "ingested_at": datetime.now(UTC).isoformat(),
        "page_count": len(pages),
        "word_count": word_count,
        "pages": pages,
    }

    write_json(manual_path(payload.manual_id), manual_data)

    return IngestResponse(
        manual_id=payload.manual_id,
        manual_name=str(manual_data["manual_name"]),
        file_path=str(source_path),
        page_count=len(pages),
        word_count=word_count,
        status="ingested",
    )

