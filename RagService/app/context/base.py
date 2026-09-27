from abc import ABC, abstractmethod
from app.models.retrieved_chunk import RetrievedChunk

class ContextBuilder(ABC):
    @abstractmethod
    def build(
        self,
        chunks: list[RetrievedChunk]
    )-> str:
        pass