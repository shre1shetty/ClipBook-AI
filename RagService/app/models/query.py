from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str
    notebook_id: str
    top_k: int= 5