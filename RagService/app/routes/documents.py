from fastapi import APIRouter,Depends

from app.dependencies import get_ingestion_service
from app.models.document import DocumentRequest
from app.services.ingestion_service import IngestionService

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

@router.post("/ingest")
def ingest_document(
    document: DocumentRequest,
    ingestion: IngestionService = Depends(get_ingestion_service)
):
    embedded_chunks=ingestion.process(document=document)
    return {
        "document_id": document.document_id,
        "notebook_id": document.notebook_id,
        "chunks_created": len(embedded_chunks),
    }