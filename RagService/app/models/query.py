from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    query: str
    notebook_id: str
    top_k: int= Field(default=5, ge=1, le=20)