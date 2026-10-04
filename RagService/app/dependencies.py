import os
from functools import lru_cache
from app.embeddings.bge import BGEEmbeddingService
from app.embeddings.base import EmbeddingService
from app.vector_store.qdrant import QdrantVectorRepository
from app.vector_store.base import VectorRepository
from app.query.base import QueryOptimizer
from app.query.simple_optimizer import SimpleQueryOptimizer
from app.reranking.base import ReRanker
from app.reranking.cross_encoder import CrossEncoderReRanker
from app.verification.base import RetrieverVerifier
from app.verification.simple_verifier import SimpleRetrieverVerifier
from app.services.retrieval_service import RetrievalService
from app.context.base import ContextBuilder
from app.context.context_builder import SimpleContextBuilder
from app.prompt.base import PromptBuilder
from app.prompt.simple_prompt_builder import SimplePromptBuilder
from app.generation.base import LLMService
from app.generation.generation_service import GenerationService
from app.generation.factory import LLMProviderFactory
from app.services.rag_service import RagService
from app.services.ingestion_service import IngestionService
from app.chunking.document_chunker import DocumentChunker

@lru_cache
def get_embedding_service() -> EmbeddingService:
    embedding_model = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
    return BGEEmbeddingService(model_name=embedding_model)

@lru_cache
def get_vector_repository() -> VectorRepository:
    return QdrantVectorRepository(collection_name="clipbook_chunks",vector_size=1024)

@lru_cache
def get_query_optimizer() -> QueryOptimizer:
    return SimpleQueryOptimizer()

@lru_cache
def get_reranker() -> ReRanker:
    reranker_model = os.getenv("RERANKER_MODEL","cross-encoder/ms-marco-MiniLM-L-6-v2")
    return CrossEncoderReRanker(model_name=reranker_model)

@lru_cache
def get_verifier() -> RetrieverVerifier:
    return SimpleRetrieverVerifier(min_score=7.0)

@lru_cache
def get_retrieval_service() -> RetrievalService:
    return RetrievalService(
        query_optimizer=get_query_optimizer(),
        vector_repository=get_vector_repository(),
        embedding_service=get_embedding_service(),
        reranker=get_reranker(),
        verifier=get_verifier()
    )

@lru_cache
def get_context_builder() -> ContextBuilder:
    return SimpleContextBuilder(max_characters = 8000)

@lru_cache
def get_prompt_builder() -> PromptBuilder:
    return SimplePromptBuilder()

@lru_cache
def get_generation_service() -> LLMService:
    provider = LLMProviderFactory.create()
    generation_service = GenerationService(provider=provider)
    return generation_service

@lru_cache
def get_rag_service() -> RagService:
    return RagService(
        retrieval_service=get_retrieval_service(),
        context_builder=get_context_builder(),
        prompt_builder=get_prompt_builder(),
        llm_service=get_generation_service()
    )

@lru_cache
def get_ingestion_service() -> IngestionService:
    return IngestionService(
        chunker=DocumentChunker(
            chunk_size=200,
            chunk_overlap=50,
            ),
        embedding_service=get_embedding_service(),
        vector_repository=get_vector_repository()
    )