from fastapi import FastAPI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.routes.rag import router as rag_router
from app.routes.documents import router as document_router
from app.dependencies import get_embedding_service,get_reranker,get_vector_repository

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_embedding_service()
    get_reranker()
    get_vector_repository()
    yield

app=FastAPI(title="ClipBook AI - RAG Service")

app.include_router(router=rag_router)
app.include_router(router=document_router)

@app.get("/")
def health():
    return {"status":"ok"}
