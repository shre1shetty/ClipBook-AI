from app.chunking.document_chunker import DocumentChunker
from app.embeddings.bge import BGEEmbeddingService
from app.models.document import DocumentRequest

def test_bge_embedding():

    embedding_service = BGEEmbeddingService()

    texts = [
        "React is a JavaScript library.",
        "Python is a programming language."
    ]

    embeddings = embedding_service.embed(texts)

    assert len(embeddings) == 2
    assert len(embeddings[0]) == 1024
    assert len(embeddings[1]) == 1024

def test_clipbook_chunk_embedding_pipeline():

    document = DocumentRequest(
        document_id="doc-1",
        notebook_id="notebook-1",
        title="React Basics",
        content="""# React

React is a JavaScript library for building user interfaces.

## Components

Components are reusable pieces of UI in React.

### Functional Components

Functional components are JavaScript functions that return UI elements.

## State

State allows components to remember information between renders.
""",
    )

    # Step 1: Chunk the document
    chunker = DocumentChunker(
        chunk_size=1000,
        chunk_overlap=150,
    )

    chunks = chunker.chunk(document)

    # Log chunks so we can inspect them
    for chunk in chunks:
        print("\n" + "=" * 80)
        print(f"Chunk Index : {chunk.chunk_index}")
        print(f"Section     : {chunk.section}")
        print(f"Heading Path: {' > '.join(chunk.heading_path)}")
        print(f"Length      : {len(chunk.content)}")
        print("-" * 80)
        print(chunk.content)

    # Step 2: Generate embeddings
    embedding_service = BGEEmbeddingService()

    texts = [chunk.content for chunk in chunks]

    embeddings = embedding_service.embed(texts)

    # Step 3: Validate
    assert len(embeddings) == len(chunks)

    for embedding in embeddings:
        assert len(embedding) == 1024
        
def test_oversized_section_is_recursively_split():

    content = " ".join(
        ["React components are reusable pieces of UI."] * 100
    )

    document = DocumentRequest(
        document_id="doc-2",
        notebook_id="notebook-1",
        title="Large React Section",
        content=f"""# React

{content}
""",
    )

    chunker = DocumentChunker(
        chunk_size=200,
        chunk_overlap=50,
    )

    chunks = chunker.chunk(document)

    print("\n" + "=" * 80)

    for chunk in chunks:
        print(f"\nChunk {chunk.chunk_index}")
        print(f"Length: {len(chunk.content)}")
        print(f"Heading: {' > '.join(chunk.heading_path)}")
        print("-" * 80)
        print(chunk.content)

    assert len(chunks) > 1

    for chunk in chunks:
        assert len(chunk.content) <= 250
        assert chunk.heading_path == ["React"]