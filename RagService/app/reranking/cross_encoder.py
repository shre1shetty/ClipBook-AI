from app.reranking.base import ReRanker
from app.models.retrieved_chunk import RetrievedChunk
from sentence_transformers import CrossEncoder
class CrossEncoderReRanker(ReRanker):
    def __init__(self, model_name: str="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model=CrossEncoder(model_name)
        
    def rerank(self, query:str, chunks: list[RetrievedChunk], top_k: int = 5) -> list[RetrievedChunk]:
        if not chunks:
            return []
        
        pairs = [
            [query, retrieved_chunk.chunk.content]
            for retrieved_chunk in chunks
        ]
        
        scores = self.model.predict(pairs)
        
        reranked = [
            (chunk, float(score))
            for chunk, score in zip(chunks, scores)
        ]
        
        reranked.sort(
            key=lambda item: item[1],
            reverse=True
        )
        
        results=[]
        
        for chunk, score in reranked[:top_k]:
            results.append(
                RetrievedChunk(
                    chunk=chunk.chunk,
                    similarity_score=chunk.similarity_score,
                    rerank_score=score
                )
            )
        
        return results