from app.models.document import DocumentRequest
from app.chunking.document_chunker import DocumentChunker
from app.embeddings.bge import BGEEmbeddingService
from app.services.ingestion_service import IngestionService
from app.vector_store.qdrant import QdrantVectorRepository

def test_delete_document():

    document_1 = DocumentRequest(
        document_id="delete-doc-1",
        notebook_id="delete-notebook",
        title="React Notes",
        content="""
# React

React is a JavaScript library for building user interfaces.

## Components

React components are reusable pieces of UI.
Components can accept inputs called props.
""",
    )

    document_2 = DocumentRequest(
        document_id="delete-doc-2",
        notebook_id="delete-notebook",
        title="Python Notes",
        content="""
# Python

Python is a programming language.

## Functions

Functions are reusable blocks of code.
""",
    )

    chunker = DocumentChunker(
        chunk_size=200,
        chunk_overlap=50,
    )

    embedding_service = BGEEmbeddingService()

    ingestion_service = IngestionService(
        chunker=chunker,
        embedding_service=embedding_service,
    )

    repository = QdrantVectorRepository(
        collection_name="test_delete_clipbook_chunks",
    )

    # Ingest both documents
    embedded_chunks_1 = ingestion_service.process(document_1)
    embedded_chunks_2 = ingestion_service.process(document_2)

    repository.upsert(embedded_chunks_1)
    repository.upsert(embedded_chunks_2)

    # Verify both documents exist
    query_embedding = embedding_service.embed(["reusable code"])[0]

    results_before_delete = repository.search(
        query_embedding=query_embedding,
        notebook_id="delete-notebook",
        top_k=10,
    )
    
    print("\n" + "=" * 80)
        
    for item in results_before_delete:
        print(f"\nChunk ID       : {item.chunk.id}")
        print(f"Document ID   : {item.chunk.document_id}")
        print(f"Chunk Index   : {item.chunk.chunk_index}")
        print(f"Section       : {item.chunk.section}")
        print(f"Heading Path  : {item.chunk.heading_path}")
        print(f"Content       : {item.chunk.content}")
        print(f"Similarity : {item.similarity_score}")

    assert any(
        result.chunk.document_id == "delete-doc-1"
        for result in results_before_delete
    )

    assert any(
        result.chunk.document_id == "delete-doc-2"
        for result in results_before_delete
    )

    # Delete document 1
    repository.delete_document("delete-doc-1")

    # Search again
    results_after_delete = repository.search(
        query_embedding=query_embedding,
        notebook_id="delete-notebook",
        top_k=10,
    )
    
    print("\n" + "=" * 80)
    
    for item in results_after_delete:
        print(f"\nChunk ID       : {item.chunk.id}")
        print(f"Document ID   : {item.chunk.document_id}")
        print(f"Chunk Index   : {item.chunk.chunk_index}")
        print(f"Section       : {item.chunk.section}")
        print(f"Heading Path  : {item.chunk.heading_path}")
        print(f"Content       : {item.chunk.content}")
        print(f"Similarity : {item.similarity_score}")

    # Document 1 should be gone
    assert not any(
        result.chunk.document_id == "delete-doc-1"
        for result in results_after_delete
    )

    # Document 2 should still exist
    assert any(
        result.chunk.document_id == "delete-doc-2"
        for result in results_after_delete
    )