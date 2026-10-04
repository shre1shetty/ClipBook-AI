from app.chunking.document_chunker import DocumentChunker
from app.models.document import DocumentRequest


def test_small_document_aware_sections_are_not_split():

    document = DocumentRequest(
        document_id="doc-1",
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
        chunk_size=1000,
        chunk_overlap=150,
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
    chunker = DocumentChunker(chunk_size=40, chunk_overlap=10)
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
    assert all(len(chunk) <= chunker.chunk_size for chunk in chunks)


def test_overlap_starts_at_a_word_boundary():
    chunker = DocumentChunker(chunk_size=40, chunk_overlap=10)

    overlap = chunker._get_overlap("alpha bravo charlie delta", 10)

    assert overlap == "delta"


def test_recursive_split_preserves_delimiters_at_chunk_boundaries():
    chunker = DocumentChunker(chunk_size=24, chunk_overlap=0)

    chunks = chunker._split_recursive(
        "First sentence. Second sentence.",
        [". "],
    )

    assert chunks == ["First sentence.", "Second sentence."]