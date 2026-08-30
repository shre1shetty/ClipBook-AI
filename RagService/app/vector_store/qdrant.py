from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams
)
from app.models.embedded_chunk import EmbeddedChunk
from app.vector_store.base import VectorRepository

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