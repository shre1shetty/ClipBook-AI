from app.models.chunk import Chunk
from app.models.query import QueryRequest
from app.models.retrieved_chunk import RetrievedChunk
from app.services.retrieval_service import RetrievalService


def test_retrieve_orders_reranked_chunks_by_document_and_chunk_index():
    reranked_chunks = [
        RetrievedChunk(
            chunk=Chunk(
                id="doc-b-1",
                document_id="doc-b",
                notebook_id="notebook-1",
                content="Second chunk in document B",
                chunk_index=1,
            ),
            similarity_score=0.8,
            rerank_score=0.9,
        ),
        RetrievedChunk(
            chunk=Chunk(
                id="doc-a-1",
                document_id="doc-a",
                notebook_id="notebook-1",
                content="Second chunk in document A",
                chunk_index=1,
            ),
            similarity_score=0.8,
            rerank_score=0.95,
        ),
        RetrievedChunk(
            chunk=Chunk(
                id="doc-a-0",
                document_id="doc-a",
                notebook_id="notebook-1",
                content="First chunk in document A",
                chunk_index=0,
            ),
            similarity_score=0.8,
            rerank_score=0.85,
        ),
        RetrievedChunk(
            chunk=Chunk(
                id="doc-b-0",
                document_id="doc-b",
                notebook_id="notebook-1",
                content="First chunk in document B",
                chunk_index=0,
            ),
            similarity_score=0.8,
            rerank_score=0.8,
        ),
    ]

    class QueryOptimizer:
        def optimize(self, query: str) -> str:
            return query

    class EmbeddingService:
        def embed(self, texts: list[str]) -> list[list[float]]:
            return [[0.0]]

    class VectorRepository:
        def search(
            self,
            query_embedding: list[float],
            notebook_id: str,
            top_k: int,
        ) -> list[RetrievedChunk]:
            return reranked_chunks

    class ReRanker:
        def rerank(
            self,
            query: str,
            chunks: list[RetrievedChunk],
            top_k: int,
        ) -> list[RetrievedChunk]:
            return reranked_chunks

    class Verifier:
        def verify(
            self,
            query: str,
            chunks: list[RetrievedChunk],
        ) -> list[RetrievedChunk]:
            assert [
                (result.chunk.document_id, result.chunk.chunk_index)
                for result in chunks
            ] == [
                ("doc-a", 0),
                ("doc-a", 1),
                ("doc-b", 0),
                ("doc-b", 1),
            ]
            return chunks

    service = RetrievalService(
        query_optimizer=QueryOptimizer(),
        vector_repository=VectorRepository(),
        embedding_service=EmbeddingService(),
        reranker=ReRanker(),
        verifier=Verifier(),
    )

    results = service.retrieve(
        QueryRequest(query="test", notebook_id="notebook-1")
    )

    assert [
        (result.chunk.document_id, result.chunk.chunk_index)
        for result in results
    ] == [
        ("doc-a", 0),
        ("doc-a", 1),
        ("doc-b", 0),
        ("doc-b", 1),
    ]
