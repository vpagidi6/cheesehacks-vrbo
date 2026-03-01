# sustAIn read-only backend

Reads usage stats for a specified account from Firestore and returns them via REST.

## Setup

1. Place `serviceAccountKey.json` (Firebase service account key) in this folder.
2. `pip install -r requirements.txt`
3. Run: `python app.py`

Server listens on **http://localhost:3000**.

## API

### GET `/users/<uid>/stats`

Returns usage numbers for the given Firebase user ID.

**Example:** `curl http://localhost:3000/users/abc123/stats`

**Response:**
```json
{
  "totalTokens": 1500,
  "totalByProvider": { "chatgpt": 800, "claude": 700 },
  "updatedAt": "2025-02-28T..."
}
```
