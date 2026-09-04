from app.embeddings.base import EmbeddingService
from app.models.query import QueryRequest
from app.query.base import QueryOptimizer
from app.vector_store.base import VectorRepository
from app.models.retrieved_chunk import RetrievedChunk
class RetrievalService:
    
    def __init__(
        self,
        query_optimizer: QueryOptimizer,
        vector_repository: VectorRepository,
        embedding_service: EmbeddingService
    ):
        self.query_optimizer = query_optimizer
        self.vector_repository = vector_repository
        self.embedding_service = embedding_service

    def retrieve(self,request: QueryRequest) -> list[RetrievedChunk]:
        optimized_query= self.query_optimizer.optimize(request.query)
        
        query_embedding=self.embedding_service.embed([optimized_query])[0]
        
        return self.vector_repository.search(
            query_embedding=query_embedding,
            notebook_id=request.notebook_id,
            top_k=request.top_k
        )
        