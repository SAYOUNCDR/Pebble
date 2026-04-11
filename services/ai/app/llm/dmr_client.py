from typing import Any

import httpx

from app.config import settings


class DMRClient:
    async def chat(self, messages: list[dict[str, str]], temperature: float = 0.1) -> str:
        payload: dict[str, Any] = {
            "model": settings.dmr_model,
            "messages": messages,
            "temperature": temperature,
        }
        endpoint = f"{settings.dmr_base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        return content if isinstance(content, str) else str(content)

