import os
from app.embeddings.base import EmbeddingService
from fastembed import TextEmbedding

class BGEEmbeddingService(EmbeddingService):
    def __init__(self,model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = TextEmbedding(
            model_name=model_name,
            cache_dir=os.getenv("MODEL_CACHE_DIR"),
            threads=1, # verify this argument in your fastembed version
        )
    
    def embed_documents(self, texts:list[str])->list[list[float]]:
        if not texts:
            return []
        return [v.tolist() for v in self.model.passage_embed(texts,batch_size=32)]
    
    def embed_query(self, query: str) -> list[float]:
        return next(iter(self.model.query_embed(query))).tolist()