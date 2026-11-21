from app.chunking.document_chunker import DocumentChunker
from app.models.document import DocumentRequest


def count_words(text: str) -> int:
    # Deterministic stand-in for the real tokenizer
    return len(text.split())


def test_small_document_aware_sections_are_not_split():

    document = DocumentRequest(
        notebook_id="notebook-1",
        title="React Basics",
        content="""# React

React is a JavaScript library.

## Components

Components are reusable pieces of UI.

### Functional Components

Functional components are JavaScript functions.

## State

State allows components to remember information.
""",
    )

    chunker = DocumentChunker(
        count_tokens=count_words,
        chunk_size=200,
        chunk_overlap=30,
    )

    chunks = chunker.chunk(document)
   
    assert len(chunks) == 4

    assert chunks[0].heading_path == ["React"]

    assert chunks[1].heading_path == [
        "React",
        "Components",
    ]

    assert chunks[2].heading_path == [
        "React",
        "Components",
        "Functional Components",
    ]

    assert chunks[3].heading_path == [
        "React",
        "State",
    ]


def test_recursive_splitting_applies_overlap_once_and_respects_chunk_size():
    content = " ".join(f"word{index}" for index in range(80))
    chunker = DocumentChunker(count_tokens=count_words, chunk_size=8, chunk_overlap=2)
    apply_overlap_calls = 0
    original_apply_overlap = chunker._apply_overlap

    def track_apply_overlap(chunks):
        nonlocal apply_overlap_calls
        apply_overlap_calls += 1
        return original_apply_overlap(chunks)

    chunker._apply_overlap = track_apply_overlap

    chunks = chunker._recursive_split(content)

    assert apply_overlap_calls == 1
    assert len(chunks) > 1
    assert all(count_words(chunk) <= chunker.chunk_size for chunk in chunks)


def test_overlap_starts_at_a_word_boundary():
    chunker = DocumentChunker(count_tokens=count_words, chunk_size=8, chunk_overlap=2)

    overlap = chunker._get_overlap("alpha bravo charlie delta", 1)

    assert overlap == "delta"


def test_recursive_split_preserves_delimiters_at_chunk_boundaries():
    chunker = DocumentChunker(count_tokens=count_words, chunk_size=2, chunk_overlap=0)

    chunks = chunker._split_recursive(
        "First sentence. Second sentence.",
        [". "],
    )

    assert chunks == ["First sentence.", "Second sentence."]