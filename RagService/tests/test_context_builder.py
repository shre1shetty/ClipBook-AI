from app.context.context_builder import SimpleContextBuilder
from app.models.chunk import Chunk
from app.models.retrieved_chunk import RetrievedChunk


def test_context_builder():

    chunks = [
        RetrievedChunk(
            chunk=Chunk(
                id="1",
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

    builder = SimpleContextBuilder(max_characters=5000)

    context = builder.build(chunks)

    print(f"\n{context.text}")

    assert "[Section: Components]" in context.text
    assert "[Heading Path: React > Components]" in context.text
    assert "Components are reusable pieces of UI in React." in context.text
    assert "[Section: State]" in context.text
    assert "[Heading Path: React > State]" in context.text
    assert "State allows components to remember information between renders." in context.text