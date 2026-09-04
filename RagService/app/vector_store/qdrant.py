from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue
)
from app.models.embedded_chunk import EmbeddedChunk
from app.vector_store.base import VectorRepository
from app.models.retrieved_chunk import RetrievedChunk
from app.models.chunk import Chunk
class QdrantVectorRepository(VectorRepository):
    
    def __init__(
        self,
        collection_name:str='clipbook_chunks',
        vector_size:int=1024
    ):
        self.collection_name=collection_name
        
        # Local in-memory Qdrant for development
        self.client = QdrantClient(path="./data/qdrant")

        self._create_collection(vector_size)
    
    def _create_collection(self,vector_size:int)->None:
        collections=self.client.get_collections().collections
        
        collection_exists=any(
            collection.name == self.collection_name
            for collection in collections
        )
    
        if not collection_exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )

    def upsert(
        self,
        chunks: list[EmbeddedChunk],
    ) -> None:

        points = []

        for item in chunks:

            chunk = item.chunk

            payload = {
                "document_id": chunk.document_id,
                "notebook_id": chunk.notebook_id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "section": chunk.section,
                "page_number": chunk.page_number,
                "heading_path": chunk.heading_path,
                "metadata": chunk.metadata,
            }

            points.append(
                PointStruct(
                    id=chunk.id,
                    vector=item.embedding,
                    payload=payload,
                )
            )

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
    
    def search(self, query_embedding:list[float],notebook_id:str,top_k:int)->list[RetrievedChunk]:
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="notebook_id",
                        match=MatchValue(value=notebook_id)
                    )
                ]
            ),
            limit=top_k,
            with_payload=True
        )
        
        retrieved_chunks=[]
        
        for point in results.points:
            payload=point.payload
            
            chunk=Chunk(
                id=str(point.id),
                document_id=payload.get("document_id"),
                notebook_id=payload.get("notebook_id"),
                content=payload.get("content"),
                chunk_index=payload.get("chunk_index"),
                section=payload.get("section"),
                page_number=payload.get("page_number"),
                heading_path=payload.get("heading_path", []),
                metadata=payload.get("metadata", {}),
            )
            
            retrieved_chunks.append(
                RetrievedChunk(
                    chunk=chunk,
                    similarity_score=point.score
                )
            )
            
        return retrieved_chunks
    
    def delete_document(self, document_id:str) -> None:
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
        )