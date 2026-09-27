from abc import ABC, abstractmethod
from app.models.retrieved_chunk import RetrievedChunk

class RetrieverVerifier(ABC):
    @abstractmethod
    def verify(
        self,
        query: str,
        chunks: list[RetrievedChunk]
    )-> list[RetrievedChunk]:
        pass