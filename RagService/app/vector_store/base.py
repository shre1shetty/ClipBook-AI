from abc import ABC,abstractmethod
from app.models.embedded_chunk import EmbeddedChunk
class VectorRepository(ABC):
    
    @abstractmethod
    def upsert(
        self,
        chunks:list[EmbeddedChunk]
    )-> None:
        pass
    
    @abstractmethod
    def search(
        self,
        query_embedding:list[float],
        notebook_id:str,
        top_k:int=5
    )->list[EmbeddedChunk]:
        pass
    
    @abstractmethod
    def delete_document(
        self,
        document_id:str
    )->None:
        pass