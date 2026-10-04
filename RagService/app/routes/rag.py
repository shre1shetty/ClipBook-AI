from fastapi import APIRouter, Depends

from app.dependencies import get_rag_service
from app.models.query import QueryRequest
from app.models.rag_response import RAGResponse
from app.services.rag_service import RagService

router=APIRouter(
    prefix="/api/rag",
    tags=["RAG"]
)

@router.post(
    "/query",
    response_model=RAGResponse
)
def query(
    request: QueryRequest,
    rag_service: RagService= Depends(get_rag_service)
):
    return rag_service.answer(request=request)
