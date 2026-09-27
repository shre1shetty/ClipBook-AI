from abc import ABC, abstractmethod
from app.models.retrieved_chunk import RetrievedChunk

class ReRanker(ABC):
    @abstractmethod
    def rerank(self, query:str, chunks: list[RetrievedChunk], top_k: int)->list[RetrievedChunk]:
        pass