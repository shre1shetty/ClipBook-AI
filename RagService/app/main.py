from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app=FastAPI(title="ClipBook AI - RAG Service")

@app.get("/")
def health():
    return {"status":"ok"}
