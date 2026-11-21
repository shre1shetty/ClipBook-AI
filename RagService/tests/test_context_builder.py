from app.context.context_builder import SimpleContextBuilder
from app.models.chunk import Chunk
from app.models.retrieved_chunk import RetrievedChunk


def count_words(text: str) -> int:
    return len(text.split())


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

    builder = SimpleContextBuilder(count_tokens=count_words, max_tokens=1000)

    context = builder.build(chunks)

    print(f"\n{context.text}")

    assert "[Section: Components]" in context.text
    assert "[Heading Path: React > Components]" in context.text
    assert "Components are reusable pieces of UI in React." in context.text
    assert "[Section: State]" in context.text
    assert "[Heading Path: React > State]" in context.text
    assert "State allows components to remember information between renders." in context.text


def test_dropped_overlap_chunk_does_not_shift_scores():
    def retrieved(id, index, content, rerank):
        return RetrievedChunk(
            chunk=Chunk(
                id=id,
                notebook_id="notebook-1",
                content=content,
                chunk_index=index,
            ),
            similarity_score=rerank,
            rerank_score=rerank,
        )

    chunks = [
        retrieved("1", 0, "alpha beta gamma", 0.9),
        retrieved("2", 1, "beta gamma", 0.6),  # fully covered by chunk 1, gets dropped
        retrieved("3", 5, "delta epsilon", 0.3),
    ]

    builder = SimpleContextBuilder(count_tokens=count_words, max_tokens=1000)

    context = builder.build(chunks)

    assert [item.chunk.id for item in context.chunks] == ["1", "3"]
    assert [item.rerank_score for item in context.chunks] == [0.9, 0.3]
