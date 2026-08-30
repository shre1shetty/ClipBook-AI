from app.chunking.document_chunker import DocumentChunker
from app.embeddings.bge import BGEEmbeddingService
from app.models.document import DocumentRequest
from app.services.ingestion_service import IngestionService


def test_ingestion_pipeline():

    document = DocumentRequest(
        document_id="doc-1",
        notebook_id="notebook-1",
        title="React Basics",
        content="""# React

React is a JavaScript library for building user interfaces.

## Components

Components are reusable pieces of UI in React.

## State

State allows components to remember information between renders.
""",
    )

    chunker = DocumentChunker(
        chunk_size=1000,
        chunk_overlap=150,
    )

    embedding_service = BGEEmbeddingService()

    ingestion_service = IngestionService(
        chunker=chunker,
        embedding_service=embedding_service,
    )

    embedded_chunks = ingestion_service.process(document)

    print("\n" + "=" * 80)

    for item in embedded_chunks:
        print(f"\nChunk ID       : {item.chunk.id}")
        print(f"Chunk Index   : {item.chunk.chunk_index}")
        print(f"Section       : {item.chunk.section}")
        print(f"Heading Path  : {item.chunk.heading_path}")
        print(f"Content       : {item.chunk.content}")
        print(f"Embedding dim : {len(item.embedding)}")

    assert len(embedded_chunks) > 0

    for item in embedded_chunks:
        assert len(item.embedding) == 1024