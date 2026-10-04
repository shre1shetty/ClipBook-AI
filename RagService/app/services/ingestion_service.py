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