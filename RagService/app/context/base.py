from abc import ABC, abstractmethod
from app.models.retrieved_chunk import RetrievedChunk
from app.models.built_context import BuiltContext
class ContextBuilder(ABC):
    @abstractmethod
    def build(
        self,
        chunks: list[RetrievedChunk]
    )-> BuiltContext:
        pass