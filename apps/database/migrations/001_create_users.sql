-- Migration: 001_create_resources
-- Foundation Database Schema for Voice/Speech Technology

CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_resource_type CHECK (type IN (
        'speech_to_text', 'text_to_speech', 'voice_biometrics',
        'llm', 'rag', 'custom'
    )),
    CONSTRAINT chk_resource_status CHECK (status IN ('active', 'inactive', 'deprecated'))
);

COMMENT ON TABLE resources IS 'ML/AI resources including STT, TTS, voice biometrics, and LLMs';

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

CREATE TABLE IF NOT EXISTS inference_logs (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    operation TEXT NOT NULL,
    duration_ms INTEGER,
    input_size INTEGER,
    output_size INTEGER,
    status TEXT NOT NULL DEFAULT 'success',
    error TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inference_status CHECK (status IN ('success', 'error', 'timeout'))
);

COMMENT ON TABLE inference_logs IS 'Audit log for all ML inference operations';

CREATE INDEX IF NOT EXISTS idx_inference_logs_resource_id ON inference_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_inference_logs_model ON inference_logs(model);
CREATE INDEX IF NOT EXISTS idx_inference_logs_created_at ON inference_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inference_logs_request_id ON inference_logs(request_id);
