from fastapi import FastAPI,Depends
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.routes.rag import router as rag_router
from app.routes.documents import router as document_router
from app.dependencies import get_embedding_service,get_reranker,get_vector_repository
from app.security import verify_internal_key

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_embedding_service()
    get_reranker()
    get_vector_repository()
    yield

app=FastAPI(title="ClipBook AI - RAG Service",lifespan=lifespan)

app.include_router(router=rag_router,dependencies=[Depends(verify_internal_key)])
app.include_router(router=document_router,dependencies=[Depends(verify_internal_key)])

@app.get("/")
def health():
    return {"status":"ok"}
