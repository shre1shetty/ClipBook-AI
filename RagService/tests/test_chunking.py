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