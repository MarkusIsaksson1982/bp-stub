-- Seed Data: Foundation Database

DELETE FROM inference_logs;
DELETE FROM resources;

ALTER SEQUENCE resources_id_seq RESTART WITH 1;
ALTER SEQUENCE inference_logs_id_seq RESTART WITH 1;

INSERT INTO resources (type, name, config, metadata, status) VALUES
    ('speech_to_text', 'Whisper Base', '{"model": "whisper-base", "language": "en"}', '{"version": "1.0", "provider": "openai"}', 'active'),
    ('speech_to_text', 'Whisper Large', '{"model": "whisper-large-v3", "language": "auto"}', '{"version": "1.0", "provider": "openai"}', 'active'),
    ('text_to_speech', 'TTS Standard', '{"model": "tts-1", "voice": "alloy"}', '{"version": "1.0", "provider": "openai"}', 'active'),
    ('text_to_speech', 'TTS HD', '{"model": "tts-1-hd", "voice": "nova"}', '{"version": "1.0", "provider": "openai"}', 'active'),
    ('voice_biometrics', 'Speaker Verification', '{"model": "resemblyzer", "threshold": 0.75}', '{"version": "1.0", "accuracy": 0.98}', 'active'),
    ('llm', 'GPT-4o Mini', '{"model": "gpt-4o-mini", "max_tokens": 4096}', '{"version": "2024-11", "provider": "openai"}', 'active'),
    ('rag', 'Meeting Assistant RAG', '{"model": "gpt-4o-mini", "chunk_size": 1000}', '{"version": "1.0", "index_type": "vector"}', 'active');

INSERT INTO inference_logs (resource_id, model, operation, duration_ms, input_size, output_size, status) VALUES
    (1, 'whisper-base', 'transcribe', 250, 150000, 500, 'success'),
    (1, 'whisper-base', 'transcribe', 280, 180000, 650, 'success'),
    (2, 'whisper-large-v3', 'transcribe', 1200, 200000, 800, 'success'),
    (3, 'tts-1', 'synthesize', 500, 100, 45000, 'success'),
    (4, 'tts-1-hd', 'synthesize', 800, 150, 72000, 'success'),
    (5, 'resemblyzer', 'verify', 100, 50000, 50, 'success'),
    (6, 'gpt-4o-mini', 'complete', 300, 200, 150, 'success'),
    (7, 'gpt-4o-mini', 'query', 450, 500, 800, 'success');
