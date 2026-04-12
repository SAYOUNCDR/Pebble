from pathlib import Path
from typing import Any

import httpx

from app.config import settings


class PageIndexAPIClient:
    def __init__(self) -> None:
        if not settings.pageindex_api_key:
            raise ValueError("PAGEINDEX_API_KEY is missing. Set it in services/ai/.env.")
        self._base_url = settings.pageindex_base_url.rstrip("/")
        self._headers = {"api_key": settings.pageindex_api_key}

    async def submit_document(self, file_path: Path) -> str:
        with file_path.open("rb") as document_file:
            files = {"file": (file_path.name, document_file, "application/pdf")}
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await client.post(
                    f"{self._base_url}/doc/",
                    headers=self._headers,
                    files=files,
                )
                response.raise_for_status()

        payload = response.json()
        doc_id = payload.get("doc_id")
        if not isinstance(doc_id, str) or not doc_id.strip():
            raise ValueError(f"Unexpected PageIndex upload response: {payload}")
        return doc_id

    async def get_document(self, doc_id: str, result_type: str | None = None, summary: bool = False) -> dict[str, Any]:
        params: dict[str, str] = {}
        if result_type:
            params["type"] = result_type
        if summary:
            params["summary"] = "true"

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{self._base_url}/doc/{doc_id}/",
                headers=self._headers,
                params=params,
            )
            response.raise_for_status()
            payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError(f"Unexpected PageIndex response: {payload}")
        return payload

