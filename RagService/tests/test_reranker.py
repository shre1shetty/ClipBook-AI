from app.models.retrieved_chunk import RetrievedChunk
from app.models.chunk import Chunk
from app.reranking.cross_encoder import CrossEncoderReRanker


def test_cross_encoder_receives_section_and_heading_path():
    class RecordingModel:
        def predict(self, pairs):
            self.pairs = pairs
            return [0.9]

    reranker = CrossEncoderReRanker.__new__(CrossEncoderReRanker)
    reranker.model = RecordingModel()
    chunks = [
        RetrievedChunk(
            chunk=Chunk(
                id="1",
                document_id="doc-1",
                notebook_id="notebook-1",
                content="Chunking supports retrieval-augmented generation.",
                chunk_index=0,
                section="Chunking's role",
                heading_path=["Chunking Strategies", "Chunking's role"],
            ),
            similarity_score=0.8,
        ),
    ]

    reranker.rerank("Why is chunking useful?", chunks)

    assert reranker.model.pairs == [[
        "Why is chunking useful?",
        "Section: Chunking's role\n"
        "Heading path: Chunking Strategies > Chunking's role\n"
        "Content: Chunking supports retrieval-augmented generation.",
    ]]


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