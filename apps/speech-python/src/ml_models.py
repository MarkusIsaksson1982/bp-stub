import structlog
from haystack import Pipeline, Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack_integrations.components.generators.ollama import OllamaGenerator

logger = structlog.get_logger()

_initialized = False
_whisper_model = None
_embedding_model = None
_rag_pipeline = None
_document_store = InMemoryDocumentStore()

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


async def initialize_models() -> None:
    global _initialized, _whisper_model, _embedding_model, _rag_pipeline

    if _initialized:
        return

    logger.info("Initializing ML models...")

    try:
        _embedding_model = SentenceTransformersTextEmbedder(
            model="sentence-transformers/all-MiniLM-L6-v2",
            device="cpu"
        )
        await _embedding_model.warm_up()
        logger.info("Embeddings model loaded")

        _rag_pipeline = Pipeline()
        _rag_pipeline.add_component("embedder", _embedding_model)
        _rag_pipeline.add_component("retriever", InMemoryEmbeddingRetriever(document_store=_document_store, top_k=5))
        _rag_pipeline.add_component(
            "llm",
            OllamaGenerator(
                model="llama3.2",
                base_url="http://ollama:11434",
                generation_kwargs={"temperature": 0.7, "num_predict": 512}
            )
        )

        _rag_pipeline.connect("embedder.embedding", "retriever.query_embedding")

        sample_docs = [Document(**d) for d in SAMPLE_DOCUMENTS]
        _document_store.write_documents(sample_docs)
        logger.info(f"Indexed {len(sample_docs)} sample documents")

        _initialized = True
        logger.info("All models initialized successfully")

    except Exception as e:
        logger.warning("Failed to initialize some models", error=str(e))
        _initialized = True


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            _whisper_model = whisper.load_model("base")
            logger.info("Whisper model loaded")
        except Exception as e:
            logger.warning("Could not load Whisper model", error=str(e))
    return _whisper_model


def get_embedding_model():
    return _embedding_model


def get_rag_pipeline():
    return _rag_pipeline


def get_document_store():
    return _document_store


def is_initialized() -> bool:
    return _initialized
