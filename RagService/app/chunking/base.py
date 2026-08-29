from abc import ABC, abstractmethod
from app.models.document import DocumentRequest,Chunk

class Chunker(ABC):
    @abstractmethod
    def chunk(self,document:DocumentRequest)->list[Chunk]:
        pass