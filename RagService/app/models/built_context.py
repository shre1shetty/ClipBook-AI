from pydantic import BaseModel
from app.models.retrieved_chunk import RetrievedChunk

class BuiltContext(BaseModel):
    text: str
    chunks: list[RetrievedChunk]