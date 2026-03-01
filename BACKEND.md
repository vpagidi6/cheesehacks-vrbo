# Connecting sustAIn to Your Backend & Database

The extension has a **login screen** (email + password) and stores an **API URL** and **auth token**. When the user is logged in, every new token-usage event is sent to your backend so you can store it per account.

---

## 1. What the extension sends

- **Login**: `POST {apiBaseUrl}/auth/login` with body `{ "email": "...", "password": "..." }`.
- **Sign up**: `POST {apiBaseUrl}/auth/register` with body `{ "email": "...", "password": "..." }`.
- **Usage (each time the user gets a response on ChatGPT/Claude/Gemini)**:  
  `POST {apiBaseUrl}/usage` with header `Authorization: Bearer <token>` and body:

```json
{
  "provider": "chatgpt",
  "model": "estimated",
  "inputTokens": 42,
  "outputTokens": 180,
  "totalTokens": 222,
  "timestamp": 1730000000000,
  "url": "https://chatgpt.com/..."
}
```

`provider` is one of `chatgpt`, `claude`, `gemini`. You can ignore `url` or use it for analytics.

---

## 2. Endpoints your backend must implement

### `POST /auth/register`

- **Body**: `{ "email": string, "password": string }`
- **Success (201 or 200)**: JSON with either:
  - `{ "token": "...", "user": { "email": "..." } }` (user is logged in right away), or
  - `{ "message": "..." }` (then the user logs in via `/auth/login`).
- **Error (4xx)**: JSON with `message` or `error` (e.g. "Email already exists"). The popup shows this to the user.

### `POST /auth/login`

- **Body**: `{ "email": string, "password": string }`
- **Success (200)**: JSON with `token` (and optionally `user: { email }`):
  - `{ "token": "<jwt-or-session-token>", "user": { "email": "..." } }`
- **Error (401/4xx)**: JSON with `message` or `error`. The popup shows this to the user.

### `POST /usage`

- **Header**: `Authorization: Bearer <token>` (the same token you returned from login/register).
- **Body**: the JSON object above (provider, model, inputTokens, outputTokens, totalTokens, timestamp, url).
- **Success (200 or 201)**: any JSON or empty body.
- **Error (401)**: if the token is invalid/expired, the extension will keep storing usage locally but the request will fail (you can optionally have the dashboard tell the user to log in again).

---

## 3. How to store token counts per account in a database

### Option A: Relational (e.g. PostgreSQL, SQLite)

1. **Users table** (one row per account):

   - `id` (primary key)
   - `email` (unique)
   - `password_hash`
   - `created_at`

2. **Usage table** (one row per usage event from the extension):

   - `id` (primary key)
   - `user_id` (foreign key → users.id)
   - `provider` (string: chatgpt, claude, gemini)
   - `model` (string)
   - `input_tokens` (int)
   - `output_tokens` (int)
   - `total_tokens` (int)
   - `timestamp` (bigint or datetime)
   - `url` (optional string)
   - `created_at` (optional, for when the row was inserted)

Example (PostgreSQL):

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  provider      TEXT NOT NULL,
  model         TEXT,
  input_tokens  INT NOT NULL,
  output_tokens INT NOT NULL,
  total_tokens  INT NOT NULL,
  timestamp     BIGINT NOT NULL,
  url           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_timestamp ON usage(timestamp);
```

On `POST /usage`:

1. Validate the JWT (or session token), get `user_id`.
2. Insert one row into `usage` with that `user_id` and the body fields.

Your dashboard can then:

- **Total tokens per user**: `SELECT user_id, SUM(total_tokens) FROM usage GROUP BY user_id`.
- **By provider**: `SELECT user_id, provider, SUM(total_tokens) FROM usage GROUP BY user_id, provider`.
- **Over time**: group by day/week using `timestamp` or `created_at`.

### Option B: NoSQL (e.g. Firebase / Firestore)

- **Collection `users`**: document id = email or auto-id; fields: `email`, `passwordHash`, etc.
- **Collection `usage`** (or subcollection `users/{userId}/usage`):
  - Fields: `provider`, `model`, `inputTokens`, `outputTokens`, `totalTokens`, `timestamp`, `url`.
  - Each document = one usage event; ensure the write is tied to the authenticated user (e.g. by `userId` in the path or in the document).

Your dashboard reads from `usage` filtered by the logged-in user and aggregates (e.g. sum of `totalTokens`, group by `provider`).

---

## 4. Summary

- Extension: login/signup + API URL in the popup; when logged in, it sends every usage event to `POST {apiBaseUrl}/usage` with `Authorization: Bearer <token>`.
- Backend: implement `POST /auth/register`, `POST /auth/login`, `POST /usage`; on `/usage` validate the token, get the user id, and insert one row (or document) per request into your DB.
- Database: one table (or collection) for users, one for usage with a user id; then your existing dashboard can query by user and aggregate token counts per account.
