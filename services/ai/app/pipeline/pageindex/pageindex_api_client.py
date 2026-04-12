import asyncio
from pathlib import Path
from typing import Any

import httpx

from app.config import settings

try:
    from pageindex import PageIndexClient as SDKPageIndexClient
except ImportError:  # pragma: no cover - optional dependency at runtime
    SDKPageIndexClient = None


class PageIndexAPIClient:
    def __init__(self) -> None:
        if not settings.pageindex_api_key:
            raise ValueError(
                "PAGEINDEX_API_KEY is missing. Set it in services/ai/.env."
            )
        self._base_url = settings.pageindex_base_url.rstrip("/")
        self._headers = {"api_key": settings.pageindex_api_key}
        self._sdk_client = (
            SDKPageIndexClient(api_key=settings.pageindex_api_key)
            if SDKPageIndexClient
            else None
        )

    @property
    def using_sdk(self) -> bool:
        return self._sdk_client is not None

    async def _sdk_submit_document(self, file_path: Path) -> str:
        result = await asyncio.to_thread(
            self._sdk_client.submit_document, str(file_path)
        )
        if isinstance(result, dict):
            doc_id = result.get("doc_id")
            if isinstance(doc_id, str) and doc_id.strip():
                return doc_id
        raise ValueError(f"Unexpected PageIndex SDK upload response: {result}")

    async def _sdk_get_document(self, doc_id: str) -> dict[str, Any]:
        result = await asyncio.to_thread(self._sdk_client.get_document, doc_id)
        if not isinstance(result, dict):
            raise ValueError(f"Unexpected PageIndex SDK response: {result}")
        return result

    async def _sdk_get_tree(self, doc_id: str, summary: bool) -> dict[str, Any]:
        result = await asyncio.to_thread(self._sdk_client.get_tree, doc_id, summary)
        if not isinstance(result, dict):
            raise ValueError(f"Unexpected PageIndex SDK tree response: {result}")
        return result

    async def submit_document(self, file_path: Path) -> str:
        if self._sdk_client is not None:
            return await self._sdk_submit_document(file_path)

        with file_path.open("rb") as document_file:
            files = {"file": (file_path.name, document_file, "application/pdf")}
            async with httpx.AsyncClient(
                timeout=settings.request_timeout_seconds
            ) as client:
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

    async def get_document(
        self, doc_id: str, result_type: str | None = None, summary: bool = False
    ) -> dict[str, Any]:
        if self._sdk_client is not None and result_type is None:
            return await self._sdk_get_document(doc_id)

        params: dict[str, str] = {}
        if result_type:
            params["type"] = result_type
        if summary:
            params["summary"] = "true"

        async with httpx.AsyncClient(
            timeout=settings.request_timeout_seconds
        ) as client:
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

    async def get_tree(self, doc_id: str, summary: bool = True) -> dict[str, Any]:
        if self._sdk_client is not None:
            return await self._sdk_get_tree(doc_id, summary=summary)
        return await self.get_document(
            doc_id=doc_id, result_type="tree", summary=summary
        )
