import time
import structlog
from fastapi import APIRouter, HTTPException
from ..models import QueryRequest, QueryResponse
from ..ml_models import get_rag_pipeline, get_document_store, is_initialized
from prometheus_client import Histogram, Counter

logger = structlog.get_logger()

router = APIRouter()

QUERY_DURATION = Histogram(
    "query_duration_seconds",
    "RAG query duration",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

QUERY_COUNT = Counter(
    "query_total",
    "Total RAG queries",
    ["status"]
)


def build_prompt(query: str, documents: list) -> str:
    doc_context = "\n\n".join([
        f"- {doc.content}" for doc in documents
    ])

    return f"""Based on the following documents, answer the user's question.

Documents:
{doc_context}

Question: {query}

Answer:"""


@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    if not is_initialized():
        raise HTTPException(503, "Models not initialized")

    pipeline = get_rag_pipeline()
    document_store = get_document_store()

    if pipeline is None:
        raise HTTPException(503, "RAG pipeline not available")

    start_time = time.time()

    try:
        result = pipeline.run({
            "embedder": {"text": request.query},
            "retriever": {"query_embedding": None}
        })

        retrieved_docs = result.get("retriever", {}).get("documents", [])
        prompt = build_prompt(request.query, retrieved_docs)

        llm_result = pipeline.run({
            "llm": {"prompt": prompt}
        })

        duration_ms = int((time.time() - start_time) * 1000)
        QUERY_DURATION.observe((time.time() - start_time))
        QUERY_COUNT.labels(status="success").inc()

        answer = llm_result.get("llm", {}).get("replies", ["No response"])[0]

        sources = [
            {
                "content": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                "meta": doc.meta
            }
            for doc in retrieved_docs[:3]
        ]

        logger.info(
            "Query completed",
            duration_ms=duration_ms,
            sources_count=len(sources)
        )

        return QueryResponse(
            answer=answer,
            query=request.query,
            sources=sources,
            model="llama3.2",
            inference_time_ms=duration_ms
        )

    except Exception as e:
        QUERY_COUNT.labels(status="error").inc()
        logger.error("Query failed", error=str(e))

        return QueryResponse(
            answer=f"I encountered an error processing your query. Please try again. (Error: {str(e)[:100]})",
            query=request.query,
            sources=[],
            model="error",
            inference_time_ms=int((time.time() - start_time) * 1000)
        )


@router.post("/query-simple")
async def query_simple(request: QueryRequest):
    from haystack.components.retrievers import InMemoryBM25Retriever

    document_store = get_document_store()
    start_time = time.time()

    try:
        retrieved_docs = document_store.retrieve(query=request.query, top_k=request.top_k)

        return {
            "answer": f"Found {len(retrieved_docs)} relevant documents for: {request.query}",
            "query": request.query,
            "documents": [
                {"content": d.content[:200] + "..." if len(d.content) > 200 else d.content, "meta": d.meta}
                for d in retrieved_docs
            ],
            "model": "bm25",
            "inference_time_ms": int((time.time() - start_time) * 1000)
        }

    except Exception as e:
        logger.error("Query failed", error=str(e))
        return {
            "answer": f"Error: {str(e)[:100]}",
            "query": request.query,
            "documents": [],
            "model": "error",
            "inference_time_ms": int((time.time() - start_time) * 1000)
        }
