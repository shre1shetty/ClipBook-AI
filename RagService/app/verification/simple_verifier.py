from app.verification.base import RetrieverVerifier
from app.models.retrieved_chunk import RetrievedChunk

class SimpleRetrieverVerifier(RetrieverVerifier):
    def __init__(self, min_score: float = 0.0):
        self.min_score = min_score
    
    def verify(
        self,
        query: str,
        chunks: list[RetrievedChunk]
    ) -> list[RetrievedChunk]:
        return [
            chunk 
            for chunk in chunks
            if chunk.rerank_score is not None
            and chunk.rerank_score >=self.min_score
        ]

