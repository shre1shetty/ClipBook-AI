from fastapi import APIRouter, Depends

from app.dependencies import get_rag_service, get_text_chat_service
from app.models.query import QueryRequest
from app.models.rag_response import RAGResponse
from app.models.text_chat import TextChatResponse,TextChatRequest
from app.services.rag_service import RagService
from app.services.text_chat_service import TextChatService

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

@router.post(
    "/chat-text",
    response_model=TextChatResponse
)
def chat_text(
    request: TextChatRequest,
    text_chat_service: TextChatService = Depends(get_text_chat_service)
):
    return text_chat_service.answer(request=request)