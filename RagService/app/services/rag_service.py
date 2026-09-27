from app.services.retrieval_service import RetrievalService
from app.context.base import ContextBuilder
from app.generation.base import LLMService
from app.models.query import QueryRequest
from app.models.rag_response import RAGSource,RAGResponse
class RagService:
    def __init__(
        self,
        retrieval_service: RetrievalService,
        context_builder: ContextBuilder,
        llm_service: LLMService
    ):
        self.retrieval_service = retrieval_service
        self.context_builder = context_builder
        self.llm_service = llm_service
        
    def answer(self, request:QueryRequest)-> RAGResponse:
        
        retrieved_chunks= self.retrieval_service.retrieve(request)
        
        context = self.context_builder.build(retrieved_chunks)
        
        answer = self.llm_service.generate(query=request.query, context=context)
        sources=[
                RAGSource(
                    document_id=result.chunk.document_id,
                    chunk_id=result.chunk.id,
                    heading_path=result.chunk.heading_path,
                    page_number=result.chunk.page_number,
                    similarity_score=result.similarity_score,
                    rerank_score=result.rerank_score,
                )
                 for result in retrieved_chunks
                ]
        
        return RAGResponse(
            answer=answer,
            sources=sources
        )
