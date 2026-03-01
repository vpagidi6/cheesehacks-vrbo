# sustAIn read-only backend

Reads usage stats for the authenticated Firebase user from Firestore and returns them via REST.

## Local setup

1. Place `serviceAccountKey.json` (Firebase service account key) in this folder.
2. `pip install -r requirements.txt`
3. Run: `python app.py` (dev) or `gunicorn -b 0.0.0.0:${PORT:-3000} app:app` (production)

Server listens on **http://localhost:3000**.

## Deploy on Cloud Run (hackathon flow)

### 1) Install and verify `gcloud`

Install: https://cloud.google.com/sdk/docs/install

```bash
gcloud --version
```

### 2) Authenticate and select your Firebase project

```bash
gcloud auth login
gcloud init
gcloud config get-value project
```

Use the same Google account and GCP project as your Firebase project.

### 3) Enable required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firestore.googleapis.com
```

### 4) Confirm backend files

This folder must contain:
- `app.py`
- `requirements.txt`

`requirements.txt`:

```txt
flask==2.3.3
flask-cors==4.0.0
firebase-admin==6.5.0
python-dotenv==1.0.1
gunicorn==21.2.0
```

In `app.py`, Flask app must be initialized as:

```python
app = Flask(__name__)
```

### 5) Deploy to Cloud Run (no Dockerfile)

From `firebase-backend/`:

```bash
gcloud run deploy eco-backend --source . --region us-central1 --allow-unauthenticated
```

When prompted:
- Platform: Cloud Run
- Region: `us-central1`
- Allow unauthenticated: `Yes`

Save the deployed URL, e.g.:
`https://eco-backend-xxxxx-uc.a.run.app`

### 6) Grant Firestore permissions

In Google Cloud Console IAM, grant your Cloud Run runtime service account the role:
- `Cloud Datastore User`

For hackathon setups this is commonly the Compute Engine default service account, unless you configured a custom Cloud Run service account.

Do not use `serviceAccountKey.json` in production.

### 7) Test API

```bash
curl https://YOUR_CLOUD_RUN_URL/users/me/stats
```

Expected:
- `401` without Firebase token
- Valid JSON with a Firebase ID token in `Authorization: Bearer <token>`

### 8) Connect frontend

```ts
const token = await firebase.auth().currentUser.getIdToken();

const res = await fetch("https://YOUR_URL/users/me/stats", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await res.json();
```

## API

### GET `/users/me/stats`

Reads `totalTokens` and `totalByProvider` from Firestore for the authenticated Firebase user, computes CO2/water/equivalence stats, and returns enriched data for the frontend.

**Example:**

```bash
curl http://localhost:3000/users/me/stats \
   -H "Authorization: Bearer <firebase-id-token>"
```

**Response:**
```json
{
  "totalTokens": 1500,
  "totalByProvider": { "chatgpt": 800, "claude": 700 },
   "totalCO2": "15 g",
   "totalWater": "750 mL",
  "equivalence": "~0.04 mi driven"
}
```
