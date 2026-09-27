from app.models.retrieved_chunk import RetrievedChunk
from app.models.chunk import Chunk
from app.reranking.cross_encoder import CrossEncoderReRanker


def test_cross_encoder_reranker():

    chunks = [
        RetrievedChunk(
            chunk=Chunk(
                id="1",
                document_id="doc-1",
                notebook_id="notebook-1",
                content="React components are reusable pieces of UI.",
                chunk_index=0,
            ),
            similarity_score=0.8,
        ),
        RetrievedChunk(
            chunk=Chunk(
                id="2",
                document_id="doc-1",
                notebook_id="notebook-1",
                content="Python is commonly used for data analysis.",
                chunk_index=1,
            ),
            similarity_score=0.7,
        ),
    ]

    reranker = CrossEncoderReRanker()

    results = reranker.rerank(
        query="What are reusable pieces of UI in React?",
        chunks=chunks,
        top_k=1,
    )

    assert len(results) == 1
    assert "reusable pieces" in results[0].chunk.content

    print(
        f"\nContent: {results[0].chunk.content}"
        f"\nScore: {results[0].similarity_score}"
    )