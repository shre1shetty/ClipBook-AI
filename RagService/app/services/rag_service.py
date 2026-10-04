from app.services.retrieval_service import RetrievalService
from app.context.base import ContextBuilder
from app.providers.base import LLMProvider
from app.models.query import QueryRequest
from app.models.rag_response import RAGSource,RAGResponse
from app.prompt.base import PromptBuilder
from app.generation.generation_service import LLMService
class RagService:
    def __init__(
        self,
        retrieval_service: RetrievalService,
        context_builder: ContextBuilder,
        llm_service: LLMService,
        prompt_builder: PromptBuilder
    ):
        self.retrieval_service = retrieval_service
        self.context_builder = context_builder
        self.llm_service = llm_service
        self.prompt_builder = prompt_builder
        
    def answer(self, request:QueryRequest)-> RAGResponse:
        
        retrieved_chunks= self.retrieval_service.retrieve(request)
        
        built_context = self.context_builder.build(retrieved_chunks)
        print(f"\nBuilt context with {len(built_context.chunks)} chunks.")
        # for chunk in built_context.chunks:
        #     print(
        #         f"\nDocument: {chunk.chunk.document_id}"
        #         f"\nChunk: {chunk.chunk.id}"
        #         f"\nContent: {chunk.chunk.content}"
        #         f"\nHeading: {' > '.join(chunk.chunk.heading_path)}"
        #         f"\nVector score: {chunk.similarity_score:.4f}"
        #         f"\nRerank score: {chunk.rerank_score:.4f}"
        #     )
        prompt= self.prompt_builder.build_prompt(query=request.query,context=built_context.text)
        print(f"\nGenerated prompt:\n{prompt}")
        answer = self.llm_service.generate(prompt=prompt)
        sources=[
                RAGSource(
                    document_id=result.chunk.document_id,
                    chunk_id=result.chunk.id,
                    heading_path=result.chunk.heading_path,
                    page_number=result.chunk.page_number,
                    similarity_score=result.similarity_score,
                    rerank_score=result.rerank_score,
                )
                 for result in built_context.chunks
                ]
        
        return RAGResponse(
            answer=answer,
            sources=sources
        )
