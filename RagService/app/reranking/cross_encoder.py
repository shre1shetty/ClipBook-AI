import os
from app.reranking.base import ReRanker
from app.models.retrieved_chunk import RetrievedChunk
from fastembed.rerank.cross_encoder import TextCrossEncoder
class CrossEncoderReRanker(ReRanker):
    def __init__(self, model_name: str):
        self.model=TextCrossEncoder(
            model_name=model_name,
            cache_dir=os.getenv("MODEL_CACHE_DIR"),
            threads=1
        )
    
    def rerank(self, query:str, chunks: list[RetrievedChunk], top_k: int = 5) -> list[RetrievedChunk]:
        if not chunks:
            return []
        
        passages = []
        for retrieved_chunk in chunks:
            chunk = retrieved_chunk.chunk
            passage_parts = []

            if chunk.section:
                passage_parts.append(f"Section: {chunk.section}")
            if chunk.heading_path:
                heading_path = " > ".join(chunk.heading_path)
                passage_parts.append(f"Heading path: {heading_path}")

            passage_parts.append(f"Content: {chunk.content}")
            passages.append("\n".join(passage_parts))
        
        scores = list(self.model.rerank(query, passages))
        
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