from pathlib import Path
from typing import Any

import orjson

from app.config import settings


def _directory(kind: str) -> Path:
    path = settings.storage_root / kind
    path.mkdir(parents=True, exist_ok=True)
    return path


def manual_path(manual_id: str) -> Path:
    return _directory("manuals") / f"{manual_id}.json"


def index_path(manual_id: str) -> Path:
    return _directory("indexes") / f"{manual_id}.json"


def checklist_path(checklist_id: str) -> Path:
    return _directory("checklists") / f"{checklist_id}.json"


def verified_checklist_path(checklist_id: str) -> Path:
    return _directory("checklists") / f"{checklist_id}.verified.json"


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return orjson.loads(path.read_bytes())


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(orjson.dumps(data, option=orjson.OPT_INDENT_2))

