from abc import ABC, abstractmethod
from app.models.document import DocumentRequest
from app.models.chunk import Chunk

class Chunker(ABC):
    @abstractmethod
    def chunk(self,document:DocumentRequest)->list[Chunk]:
        pass