# FastAPI + Firestore Backend (Hackathon)

Simple backend for the sustainability extension + web app.

## Tech
- FastAPI
- Uvicorn
- Firebase Admin SDK
- Firestore
- Pydantic

## Setup

1. Put your Firebase service account JSON in one of these places:
   - Set env var `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json`
   - Or place file at `backend/serviceAccount.json`

2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Run server:

```bash
uvicorn main:app --reload
```

Server runs at `http://127.0.0.1:8000`.

## Endpoints

### POST /api/ingest
Dedupes by `eventHash` per user, stores event, updates daily aggregate.

```bash
curl -X POST http://127.0.0.1:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "user": "someone@wisc.edu",
    "provider": "chatgpt",
    "ts": "2026-02-28T21:13:00Z",
    "tokens": 1200,
    "ml": 18,
    "eventHash": "uniquehashstring"
  }'
```

### GET /api/summary?user=email&month=YYYY-MM
Returns today, settings, month daily docs, and provider breakdown.

```bash
curl "http://127.0.0.1:8000/api/summary?user=someone@wisc.edu&month=2026-02"
```

### POST /api/settings
Saves user settings.

```bash
curl -X POST http://127.0.0.1:8000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "user": "someone@wisc.edu",
    "dailyLimitMl": 500,
    "estimationMode": "range"
  }'
```

## Firestore Structure

- `users/{user}/events/{eventHash}`
  - `provider`, `ts`, `tokens`, `ml`
- `users/{user}/daily/{YYYY-MM-DD}`
  - `date`, `ml`, `tokens`, `byProvider`
- `users/{user}/settings/main`
  - `dailyLimitMl`, `estimationMode`

## Notes
- CORS is fully open (`*`) for hackathon speed.
- User identity is email-only string from frontend.
- No Firebase Auth used.
