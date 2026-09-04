from pydantic import BaseModel
from app.models.chunk import Chunk

class RetrievedChunk(BaseModel):
    chunk:Chunk
    similarity_score:float