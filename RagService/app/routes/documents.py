from fastapi import APIRouter,Depends,Response  ,status

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
    ingestion_service: IngestionService = Depends(get_ingestion_service)
):
    embedded_chunks=ingestion_service.process(document=document)
    return {
        "notebook_id": document.notebook_id,
        "chunks_created": len(embedded_chunks),
    }
    
@router.delete("/{notebook_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    notebook_id: str,
    ingestion_service: IngestionService = Depends(get_ingestion_service)
):
    ingestion_service.delete_document(notebook_id=notebook_id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
    