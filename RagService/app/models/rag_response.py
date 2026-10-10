from pydantic import BaseModel,Field

class RAGSource(BaseModel):
    chunk_id: str
    heading_path: list[str] = Field(default_factory=list)
    page_number: int | None = None
    similarity_score: float
    rerank_score: float | None = None
    
class RAGResponse(BaseModel):
    answer: str
    sources: list[RAGSource] = Field(default_factory=list)