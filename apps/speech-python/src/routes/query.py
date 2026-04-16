import time
import structlog
from fastapi import APIRouter, HTTPException
from ..models import QueryRequest, QueryResponse
from ..ml_models import get_rag_pipeline, is_initialized
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

SAMPLE_DOCUMENTS = [
    {
        "content": "Meeting Notes - Q4 Planning 2024: Discussed product roadmap, Q1 milestones include voice transcription API launch. Action items: finalize API spec by Dec 15, complete security audit by Jan 10.",
        "meta": {"source": "meeting_notes", "date": "2024-11-15", "meeting_id": "mt-001"}
    },
    {
        "content": "Technical Architecture Decision: Use Whisper for speech-to-text with fallback to Deepgram. Haystack for RAG pipeline with sentence-transformers embeddings. Consider Azure Cognitive Services for production scaling.",
        "meta": {"source": "architecture", "date": "2024-10-20", "doc_id": "arch-001"}
    },
    {
        "content": "Performance Benchmark Results: Whisper base model processes 1x realtime on CPU, 10x on GPU. Embedding generation: 50 docs/second. RAG query latency p95: 800ms with 100 document corpus.",
        "meta": {"source": "benchmarks", "date": "2024-11-01", "test_id": "bench-001"}
    },
    {
        "content": "Security Review Summary: All API endpoints require authentication. Rate limiting: 100 req/min per client. Data retention policy: 90 days. PII handling documented in compliance handbook.",
        "meta": {"source": "security", "date": "2024-09-15", "review_id": "sec-001"}
    },
    {
        "content": "User Feedback Analysis: Top 3 requested features: 1) Real-time transcription, 2) Multi-language support, 3) Custom vocabulary. NPS score: 72. Support ticket volume: 15/week.",
        "meta": {"source": "feedback", "date": "2024-10-30", "period": "Q3"}
    }
]


@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    if not is_initialized():
        raise HTTPException(503, "Models not initialized")
    
    pipeline = get_rag_pipeline()
    if pipeline is None:
        raise HTTPException(503, "RAG pipeline not available, using fallback response")
    
    start_time = time.time()
    
    try:
        from haystack import Document
        
        docs = [Document(**d) for d in SAMPLE_DOCUMENTS]
        
        result = pipeline.run({
            "embedder": {"text": request.query},
            "retriever": {"query_embedding": None, "documents": docs},
            "llm": {"prompt": build_prompt(request.query, docs)}
        })
        
        duration_ms = int((time.time() - start_time) * 1000)
        QUERY_DURATION.observe((time.time() - start_time))
        QUERY_COUNT.labels(status="success").inc()
        
        answer = result["llm"]["replies"][0] if result.get("llm", {}).get("replies") else "Fallback response"
        
        sources = [
            {
                "content": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                "meta": doc.meta
            }
            for doc in result.get("retriever", {}).get("documents", [])[:3]
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


def build_prompt(query: str, documents: list) -> str:
    doc_context = "\n\n".join([
        f"- {doc.content}" for doc in documents
    ])
    
    return f"""Based on the following documents, answer the user's question.

Documents:
{doc_context}

Question: {query}

Answer:"""


@router.post("/query-simple")
async def query_simple(request: QueryRequest):
    from haystack import Document
    from haystack.components.retrievers import InMemoryBM25Retriever
    
    pipeline = get_rag_pipeline()
    
    start_time = time.time()
    
    docs = [Document(**d) for d in SAMPLE_DOCUMENTS]
    
    if pipeline:
        try:
            result = pipeline.run({
                "embedder": {"text": request.query},
                "retriever": {"query_embedding": None, "documents": docs},
                "llm": {"prompt": build_prompt(request.query, docs)}
            })
            
            answer = result["llm"]["replies"][0] if result.get("llm", {}).get("replies") else "No response"
            
            return {
                "answer": answer,
                "query": request.query,
                "sources_count": len(result.get("retriever", {}).get("documents", [])),
                "model": "llama3.2",
                "inference_time_ms": int((time.time() - start_time) * 1000)
            }
        except Exception:
            pass
    
    retriever = InMemoryBM25Retriever(top_k=request.top_k)
    retriever.fit(SAMPLE_DOCUMENTS)
    
    relevant_docs = retriever.retrieve(request.query)
    
    return {
        "answer": f"Found {len(relevant_docs)} relevant documents for: {request.query}",
        "query": request.query,
        "documents": [
            {"content": d.content[:200] + "..." if len(d.content) > 200 else d.content, "meta": d.meta}
            for d in relevant_docs
        ],
        "model": "bm25",
        "inference_time_ms": int((time.time() - start_time) * 1000)
    }
