from app.embeddings.base import EmbeddingService
from app.models.query import QueryRequest
from app.query.base import QueryOptimizer
from app.vector_store.base import VectorRepository
from app.models.retrieved_chunk import RetrievedChunk
from app.reranking.base import ReRanker

class RetrievalService:
    
    def __init__(
        self,
        query_optimizer: QueryOptimizer,
        vector_repository: VectorRepository,
        embedding_service: EmbeddingService,
        reranker: ReRanker
    ):
        self.query_optimizer = query_optimizer
        self.vector_repository = vector_repository
        self.embedding_service = embedding_service
        self.reranker = reranker

    def retrieve(self,request: QueryRequest) -> list[RetrievedChunk]:
        optimized_query= self.query_optimizer.optimize(request.query)
        
        query_embedding=self.embedding_service.embed([optimized_query])[0]
        
        candidates = self.vector_repository.search(
            query_embedding=query_embedding,
            notebook_id=request.notebook_id,
            top_k=request.top_k * 3
        )
        
        return self.reranker.rerank(
            query=optimized_query,
            chunks=candidates,
            top_k=request.top_k
        )
        