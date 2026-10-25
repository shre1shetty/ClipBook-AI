from abc import ABC,abstractmethod

class EmbeddingService(ABC):  
    @abstractmethod
    def embed_documents(self,texts:list[str])->list[list[float]]:
        pass
    
    @abstractmethod
    def embed_query(self, query: str) -> list[float]:
        pass
