# Database Schema Documentation

This document describes the PostgreSQL schema designed for voice and speech technology products.

---

## Entity Relationship Diagram (Text)

```text
+-----------------------------+
|         resources           |
+-----------------------------+
| id PK, SERIAL               |
| type TEXT NOT NULL          |
| name TEXT NOT NULL          |
| config JSONB                |
| metadata JSONB              |
| status TEXT                 |
| created_at TIMESTAMPTZ      |
| updated_at TIMESTAMPTZ      |
+-----------+-----------------+
            | 1
            |
            | many
+-----------v-----------------+
|       inference_logs        |
+-----------------------------+
| id PK, SERIAL               |
| resource_id FK -> resources |
| model TEXT NOT NULL         |
| operation TEXT NOT NULL     |
| duration_ms INTEGER         |
| input_size INTEGER          |
| output_size INTEGER         |
| status TEXT                 |
| error TEXT                  |
| created_at TIMESTAMPTZ      |
+-----------------------------+
```

---

## Resource Types

| Type | Description |
|------|-------------|
| `speech_to_text` | STT/ASR models (Whisper, etc.) |
| `text_to_speech` | TTS models (ElevenLabs, etc.) |
| `voice_biometrics` | Speaker verification/identification |
| `llm` | Language models for text processing |
| `rag` | Retrieval-augmented generation pipelines |

---

## Normalization (3NF)

- All columns contain atomic values
- Each row identifiable by primary key
- No transitive dependencies

---

## Index Strategy

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_resources_type` | resources | type | Filter by resource type |
| `idx_resources_status` | resources | status | Filter active/inactive |
| `idx_inference_logs_resource_id` | inference_logs | resource_id | Logs per resource |
| `idx_inference_logs_model` | inference_logs | model | Performance by model |
| `idx_inference_logs_created_at` | inference_logs | created_at DESC | Recent activity |

---

## Query Patterns

### Resource Performance

```sql
SELECT
  r.name,
  r.type,
  COUNT(i.id) AS total_inferences,
  AVG(i.duration_ms) AS avg_duration_ms,
  AVG(CASE WHEN i.status = 'success' THEN 1 ELSE 0 END) * 100 AS success_rate
FROM resources r
LEFT JOIN inference_logs i ON r.id = i.resource_id
WHERE i.created_at > NOW() - INTERVAL '24 hours'
GROUP BY r.id, r.name, r.type;
```

### Model Cost Analysis

```sql
SELECT
  model,
  operation,
  COUNT(*) AS call_count,
  SUM(input_size) AS total_input_bytes,
  SUM(output_size) AS total_output_bytes
FROM inference_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY model, operation;
```

---

## Security

1. Use parameterized queries exclusively
2. Implement row-level security for multi-tenant workloads
3. Encrypt sensitive metadata at rest
4. Audit access patterns via inference_logs

---

## Migration Philosophy

- Sequential numbering ensures deterministic order
- Use `IF NOT EXISTS` for idempotency
- Each up migration needs a down migration
- Test on staging before production
