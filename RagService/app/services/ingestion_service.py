from app.chunking.base import Chunker
from app.embeddings.base import EmbeddingService
from app.models.document import DocumentRequest
from app.models.embedded_chunk import EmbeddedChunk
from app.vector_store.base import VectorRepository

class IngestionService:
    
    def __init__(
        self,
        chunker: Chunker,
        embedding_service: EmbeddingService,
        vector_repository: VectorRepository
        ):
        self.chunker=chunker
        self.embedding_service=embedding_service
        self.vector_repository=vector_repository
    
    def process(self,document:DocumentRequest)->list[EmbeddedChunk]:
        
        chunks=self.chunker.chunk(document)
        print("Chunks ready")
        texts=[]
        
        for chunk in chunks:
            passage_parts=[]
            if chunk.section:
                passage_parts.append(f"Section: {chunk.section}")
            if chunk.heading_path:
                heading_path = " > ".join(chunk.heading_path)
                passage_parts.append(f"Heading path: {heading_path}")
            
            passage_parts.append(f"Content: {chunk.content}")
            texts.append("\n".join(passage_parts))
        print("Chunks formatted")
        embeddings=self.embedding_service.embed(texts) #batching the embeddings to not call embedding recursively
        print("Embedded chunks ready")
        embedded_chunks = [
            EmbeddedChunk(
                chunk=chunk,
                embedding=embedding
            )
            for chunk,embedding
            in 
            zip(chunks,embeddings)
        ]
        print("Chunks ready to upsert")
        self.delete_document(notebook_id=document.notebook_id)
        self.vector_repository.upsert(embedded_chunks)
        return embedded_chunks
    
    def delete_document(self,notebook_id:str) -> None:
        print(notebook_id)
        self.vector_repository.delete_document(notebook_id=notebook_id)