from app.models.chunk import Chunk
from app.models.retrieved_chunk import RetrievedChunk
from app.verification.simple_verifier import SimpleRetrieverVerifier


def create_chunk(
    chunk_id: str,
    rerank_score: float | None,
) -> RetrievedChunk:
    return RetrievedChunk(
        chunk=Chunk(
            id=chunk_id,
            document_id="doc-1",
            notebook_id="notebook-1",
            content=f"Content {chunk_id}",
            chunk_index=int(chunk_id),
        ),
        similarity_score=0.8,
        rerank_score=rerank_score,
    )


def test_verifier_keeps_relevant_chunks():
    chunks = [
        create_chunk("1", 1.5),
        create_chunk("2", 1.2),
    ]

    verifier = SimpleRetrieverVerifier(min_score=1.0)

    result = verifier.verify(
        query="test query",
        chunks=chunks,
    )

    assert len(result) == 2


def test_verifier_removes_irrelevant_chunks():
    chunks = [
        create_chunk("1", 1.5),
        create_chunk("2", 0.5),
        create_chunk("3", 1.2),
    ]

    verifier = SimpleRetrieverVerifier(min_score=1.0)

    results = verifier.verify(
        query="test query",
        chunks=chunks,
    )

    assert [chunk.chunk.id for chunk in results] == ["1", "3"]
    for result in results:
        print(
            f"\nChunk: {result.chunk.id}"
            f"\nSimilarity: {result.similarity_score}"
            f"\nRerank: {result.rerank_score}"
            f"\nContent: {result.chunk.content}"
        )


def test_verifier_returns_empty_when_no_chunks_are_relevant():
    chunks = [
        create_chunk("1", 0.5),
        create_chunk("2", 0.2),
    ]

    verifier = SimpleRetrieverVerifier(min_score=1.0)

    result = verifier.verify(
        query="test query",
        chunks=chunks,
    )

    assert result == []


def test_verifier_removes_chunks_without_rerank_score():
    chunks = [
        create_chunk("1", 1.5),
        create_chunk("2", None),
    ]

    verifier = SimpleRetrieverVerifier(min_score=1.0)

    results = verifier.verify(
        query="test query",
        chunks=chunks,
    )

    assert [chunk.chunk.id for chunk in results] == ["1"]
    
    for result in results:
        print(
            f"\nChunk: {result.chunk.id}"
            f"\nSimilarity: {result.similarity_score}"
            f"\nRerank: {result.rerank_score}"
            f"\nContent: {result.chunk.content}"
        )