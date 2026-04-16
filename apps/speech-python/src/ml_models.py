import asyncio
import time
import structlog
from typing import Any

logger = structlog.get_logger()

_initialized = False
_whisper_model = None
_embedding_model = None
_rag_pipeline = None


async def initialize_models() -> None:
    global _initialized, _whisper_model, _embedding_model, _rag_pipeline
    
    if _initialized:
        return
    
    logger.info("Initializing ML models...")
    
    try:
        from haystack import Pipeline
        from haystack.components.retrievers import InMemoryEmbeddingRetriever
        from haystack.components.embedders import SentenceTransformersTextEmbedder
        from haystack_integrations.components.generators import OllamaGenerator
        
        _embedding_model = SentenceTransformersTextEmbedder(
            model="sentence-transformers/all-MiniLM-L6-v2",
            device="cpu"
        )
        await _embedding_model.warm_up()
        logger.info("Embeddings model loaded")
        
        _rag_pipeline = Pipeline()
        _rag_pipeline.add_component("embedder", _embedding_model)
        _rag_pipeline.add_component("retriever", InMemoryEmbeddingRetriever(top_k=5))
        _rag_pipeline.add_component(
            "llm",
            OllamaGenerator(
                model="llama3.2",
                base_url="http://ollama:11434",
                generation_kwargs={"temperature": 0.7}
            )
        )
        
        _rag_pipeline.connect("embedder.embedding", "retriever.query_embedding")
        
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


def is_initialized() -> bool:
    return _initialized
