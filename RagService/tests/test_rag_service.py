from app.chunking.document_chunker import DocumentChunker
from app.context.context_builder import SimpleContextBuilder
from app.embeddings.bge import BGEEmbeddingService
from app.generation.mock_llm import MockLLMService
from app.models.document import DocumentRequest
from app.models.query import QueryRequest
from app.query.simple_optimizer import SimpleQueryOptimizer
from app.reranking.cross_encoder import CrossEncoderReRanker
from app.services.ingestion_service import IngestionService
from app.services.rag_service import RagService
from app.services.retrieval_service import RetrievalService
from app.vector_store.qdrant import QdrantVectorRepository


def test_rag_service():

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
        collection_name="test_rag_chunks",
    )

    repository.upsert(embedded_chunks)

    retrieval_service = RetrievalService(
        query_optimizer=SimpleQueryOptimizer(),
        embedding_service=embedding_service,
        vector_repository=repository,
        reranker=CrossEncoderReRanker(),
    )

    rag_service = RagService(
        retrieval_service=retrieval_service,
        context_builder=SimpleContextBuilder(),
        llm_service=MockLLMService(),
    )

    request = QueryRequest(
        query="What are reusable pieces of UI in React?",
        notebook_id=notebook_id,
        top_k=3,
    )

    response = rag_service.answer(request)

    print(f"\nAnswer : {response.answer}")
    
    for source in response.sources:
        print(
            f"\nDocument: {source.document_id}"
            f"\nChunk: {source.chunk_id}"
            f"\nHeading: {' > '.join(source.heading_path)}"
            f"\nVector score: {source.similarity_score:.4f}"
            f"\nRerank score: {source.rerank_score:.4f}"
        )

    assert "What are reusable pieces of UI in React?" in response.answer
    assert "reusable pieces of UI" in response.answer
    assert "React > Components" in response.answer
    assert len(response.sources) > 0
    assert response.sources[0].document_id == "doc-1"
    assert response.sources[0].heading_path == [
    "React",
    "Components",
    ]