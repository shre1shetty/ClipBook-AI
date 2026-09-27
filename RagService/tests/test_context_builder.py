from app.context.context_builder import SimpleContextBuilder
from app.models.chunk import Chunk
from app.models.retrieved_chunk import RetrievedChunk


def test_context_builder():

    chunks = [
        RetrievedChunk(
            chunk=Chunk(
                id="1",
                document_id="doc-1",
                notebook_id="notebook-1",
                content="Components are reusable pieces of UI in React.",
                chunk_index=0,
                section="Components",
                heading_path=['React', 'Components']
            ),
            similarity_score=0.8,
            rerank_score=1.5,
        ),
        RetrievedChunk(
            chunk=Chunk(
                id="2",
                document_id="doc-1",
                notebook_id="notebook-1",
                content="State allows components to remember information between renders.",
                chunk_index=1,
                section="State",
                heading_path=['React', 'State']
            ),
            similarity_score=0.7,
            rerank_score=1.2,
        ),
    ]

    builder = SimpleContextBuilder()

    context = builder.build(chunks)

    print(f"\n{context}")

    assert "Section: Components" in context
    assert "Heading Path: React > Components" in context
    assert "Components are reusable pieces of UI in React." in context
    assert "Section: State" in context
    assert "Heading Path: React > State" in context
    assert "State allows components to remember information between renders." in context