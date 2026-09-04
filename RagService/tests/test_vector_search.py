from app.chunking.document_chunker import DocumentChunker
from app.embeddings.bge import BGEEmbeddingService
from app.models.document import DocumentRequest
from app.services.ingestion_service import IngestionService
from app.vector_store.qdrant import QdrantVectorRepository
from app.services.retrieval_service import RetrievalService
from app.query.simple_optimizer import SimpleQueryOptimizer 
from app.models.query import QueryRequest
def test_vector_search():

    notebook_id = "notebook-1"
    document = DocumentRequest(
        document_id="doc-1",
        notebook_id=notebook_id,
        title="React Notes",
        content="""
# React

React is a JavaScript library for building user interfaces.

## Components

React components are reusable pieces of UI.
Components can accept inputs called props.

## State

State allows components to store information that can change over time.
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

    embedded_chunks = ingestion_service.process(document)

    repository = QdrantVectorRepository(
        collection_name="test_clipbook_chunks",
    )

    repository.upsert(embedded_chunks)

    query = "What are reusable pieces of UI in React?"

    request = QueryRequest(
        query=query,
        notebook_id=notebook_id,
        top_k=3
    )
    
    query_optimizer=SimpleQueryOptimizer()
    
    retrieval_service= RetrievalService(
        query_optimizer=query_optimizer,
        vector_repository=repository,
        embedding_service=embedding_service
    )

    results= retrieval_service.retrieve(request)

    assert len(results) > 0
    assert len(results) <= 3

    for result in results:
        print(
            f"\nScore: {result.similarity_score:.4f}"
            f"\nSection: {result.chunk.section}"
            f"\nContent: {result.chunk.content}"
        )

    assert any(
        "reusable pieces" in result.chunk.content
        for result in results
    )