from fastapi import FastAPI
from dotenv import load_dotenv

from app.routes.rag import router as rag_router
from app.routes.documents import router as document_router

load_dotenv()

app=FastAPI(title="ClipBook AI - RAG Service")

app.include_router(router=rag_router)
app.include_router(router=document_router)

@app.get("/")
def health():
    return {"status":"ok"}
