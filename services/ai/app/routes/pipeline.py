from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    BuildIndexRequest,
    BuildIndexResponse,
    GenerateChecklistRequest,
    GenerateChecklistResponse,
    IngestRequest,
    IngestResponse,
    VerifyChecklistRequest,
    VerifyChecklistResponse,
)
from app.pipeline.checklist.generate_service import generate_checklist
from app.pipeline.ingest.ingest_service import ingest_manual
from app.pipeline.pageindex.pageindex_service import build_pageindex
from app.pipeline.verify.verify_service import verify_checklist

router = APIRouter(prefix="/v1", tags=["pipeline"])


@router.post("/ingest", response_model=IngestResponse)
def ingest(payload: IngestRequest) -> IngestResponse:
    try:
        return ingest_manual(payload)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/pageindex/build", response_model=BuildIndexResponse)
async def build_index(payload: BuildIndexRequest) -> BuildIndexResponse:
    try:
        return await build_pageindex(payload)
    except TimeoutError as error:
        raise HTTPException(status_code=504, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/checklist/generate", response_model=GenerateChecklistResponse)
async def generate(payload: GenerateChecklistRequest) -> GenerateChecklistResponse:
    try:
        return await generate_checklist(payload)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/checklist/verify", response_model=VerifyChecklistResponse)
def verify(payload: VerifyChecklistRequest) -> VerifyChecklistResponse:
    try:
        return verify_checklist(payload)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
