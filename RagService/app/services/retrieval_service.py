from app.embeddings.base import EmbeddingService
from app.models.query import QueryRequest
from app.query.base import QueryOptimizer
from app.vector_store.base import VectorRepository
from app.models.retrieved_chunk import RetrievedChunk
from app.reranking.base import ReRanker
from app.verification.base import RetrieverVerifier
class RetrievalService:
    
    def __init__(
        self,
        query_optimizer: QueryOptimizer,
        vector_repository: VectorRepository,
        embedding_service: EmbeddingService,
        reranker: ReRanker,
        verifier: RetrieverVerifier
    ):
        self.query_optimizer = query_optimizer
        self.vector_repository = vector_repository
        self.embedding_service = embedding_service
        self.reranker = reranker
        self.verifier = verifier

    def retrieve(self,request: QueryRequest) -> list[RetrievedChunk]:
        optimized_query= self.query_optimizer.optimize(request.query)
        
        query_embedding=self.embedding_service.embed([optimized_query])[0]
        
        candidates = self.vector_repository.search(
            query_embedding=query_embedding,
            notebook_id=request.notebook_id,
            top_k=request.top_k * 3
        )
        
        reranked_chunks = self.reranker.rerank(
            query=optimized_query,
            chunks=candidates,
            top_k=request.top_k
        )
        reranked_chunks.sort(
            key=lambda result: (
                result.chunk.document_id,
                result.chunk.chunk_index,
            )
        )
        
        print(f"\nRetrieved {len(reranked_chunks)} chunks after reranking.")
        for chunk in reranked_chunks:
            print(
                f"\nDocument: {chunk.chunk.document_id}"
                f"\nChunk: {chunk.chunk.id}"
                f"\nChunk index: {chunk.chunk.chunk_index}"
                f"\nContent: {chunk.chunk.content}"
                f"\nHeading: {' > '.join(chunk.chunk.heading_path)}"
                f"\nVector score: {chunk.similarity_score:.4f}"
                f"\nRerank score: {chunk.rerank_score:.4f}"
            )
        return self.verifier.verify(
            query=optimized_query,
            chunks=reranked_chunks
        )
        