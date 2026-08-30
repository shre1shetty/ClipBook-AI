from app.chunking.base import Chunker
from app.embeddings.base import EmbeddingService
from app.models.document import DocumentRequest
from app.models.embedded_chunk import EmbeddedChunk

class IngestionService:
    
    def __init__(self,chunker:Chunker,embedding_service:EmbeddingService):
        self.chunker=chunker
        self.embedding_service=embedding_service
    
    def process(self,document:DocumentRequest)->list[EmbeddedChunk]:
        
        chunks=self.chunker.chunk(document)
        
        texts=[chunk.content for chunk in chunks]
        
        embeddings=self.embedding_service.embed(texts) #batching the embeddings to not call embedding recursively
        
        return [
            EmbeddedChunk(
                chunk=chunk,
                embedding=embedding
            )
            for chunk,embedding
            in 
            zip(chunks,embeddings)
        ]