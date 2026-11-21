FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    MODEL_CACHE_DIR=/opt/models \
    OMP_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false

WORKDIR /code

COPY requirements.txt .
RUN pip install -r requirements.txt

# Bake models into the image so cold starts don't download them.
# Keep these defaults in sync with app/dependencies.py.
ARG EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
ARG RERANKER_MODEL=Xenova/ms-marco-MiniLM-L-6-v2
RUN python -c "\
from fastembed import TextEmbedding; \
from fastembed.rerank.cross_encoder import TextCrossEncoder; \
TextEmbedding(model_name='${EMBEDDING_MODEL}', cache_dir='${MODEL_CACHE_DIR}'); \
TextCrossEncoder(model_name='${RERANKER_MODEL}', cache_dir='${MODEL_CACHE_DIR}')"

COPY app ./app

# Local Qdrant path used by qdrant.py (./data/qdrant)
RUN useradd -m appuser && mkdir -p /code/data/qdrant \
    && chown -R appuser:appuser /code /opt/models
USER appuser

EXPOSE 8000

# One worker only: embedded Qdrant locks its storage folder, and each
# extra worker would load its own copy of the models into RAM.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
