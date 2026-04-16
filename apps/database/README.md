# @foundation/db

PostgreSQL schema foundation for voice and speech technology.

## Tables

### resources

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| type | TEXT | Resource type (speech_to_text, text_to_speech, voice_biometrics, llm, rag) |
| name | TEXT | Resource name |
| config | JSONB | Model configuration |
| metadata | JSONB | Additional metadata |
| status | TEXT | active/inactive/deprecated |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### inference_logs

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| resource_id | INTEGER | FK to resources |
| model | TEXT | Model identifier |
| operation | TEXT | Operation type |
| duration_ms | INTEGER | Inference duration |
| input_size | INTEGER | Input bytes |
| output_size | INTEGER | Output bytes |
| status | TEXT | success/error/timeout |
| error | TEXT | Error message (if any) |
| request_id | TEXT | Request correlation ID |
| created_at | TIMESTAMPTZ | Inference timestamp |

## Migrations

```bash
npm run migrate:up     # Run pending migrations
npm run migrate:down    # Rollback last migration
npm run migrate:redo    # Rollback and re-run
```

## Setup (Local)

```bash
./scripts/setup.sh
```

## Reset (Local)

```bash
./scripts/reset.sh
```
