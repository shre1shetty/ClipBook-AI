from fastapi import FastAPI

app=FastAPI(title="ClipBook AI - RAG Service")

@app.get("/")
def health():
    return {"status":"ok"}
