from sentence_transformers import SentenceTransformer
from app.embeddings.base import EmbeddingService

class BGEEmbeddingService(EmbeddingService):
    def __init__(self,model_name: str = "BAAI/bge-m3"):
        self.model=SentenceTransformer(model_name)
    
    def embed(self, texts:list[str])->list[list[float]]:
        embeddings=self.model.encode(
            texts,
            batch_size=32, # to make sure in batch processing it doesnt exceed 32 at a time so it doesnt melt all ram
            normalize_embeddings=True
        )
        
        return embeddings.tolist()