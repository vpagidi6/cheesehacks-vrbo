"""
sustAIn backend: auth + usage stored in Firebase Firestore.

Set env vars:
  GOOGLE_APPLICATION_CREDENTIALS = path to Firebase service account JSON
  JWT_SECRET = any long random string (for signing tokens)

Or create a .env file with JWT_SECRET and put the service account at
./serviceAccountKey.json
"""

import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.transforms import Increment

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production-use-env")
JWT_EXPIRY_DAYS = 30
PORT = int(os.environ.get("PORT", "3000"))

# Initialize Firebase Admin
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
if not Path(cred_path).exists():
    raise SystemExit(
        "Firebase init failed. Put serviceAccountKey.json in this folder "
        "or set GOOGLE_APPLICATION_CREDENTIALS."
    )
cred = credentials.Certificate(cred_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__)
CORS(app)


def get_user_by_email(email):
    refs = db.collection("users").where("email", "==", email).limit(1).stream()
    for ref in refs:
        return ref
    return None


def create_token(user_id, email):
    now = datetime.now(timezone.utc)
    payload = {
        "userId": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_EXPIRY_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_middleware():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None, jsonify({"error": "Missing or invalid Authorization header"}), 401
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return (payload.get("userId"), payload.get("email")), None, None
    except jwt.InvalidTokenError:
        return None, jsonify({"error": "Invalid or expired token"}), 401


@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if get_user_by_email(email):
        return jsonify({"error": "Email already registered"}), 400
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    ref = db.collection("users").add({
        "email": email,
        "passwordHash": password_hash,
        "createdAt": SERVER_TIMESTAMP,
    })[1]
    token = create_token(ref.id, email)
    return jsonify({"token": token, "user": {"email": email}}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    ref = get_user_by_email(email)
    if not ref:
        return jsonify({"error": "Invalid email or password"}), 401
    user = ref.to_dict()
    if not bcrypt.checkpw(password.encode("utf-8"), user["passwordHash"].encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401
    token = create_token(ref.id, email)
    return jsonify({"token": token, "user": {"email": email}})


@app.route("/usage", methods=["POST"])
def usage():
    auth_result, err_response, err_code = auth_middleware()
    if err_response is not None:
        return err_response, err_code
    user_id, _ = auth_result
    data = request.get_json() or {}
    provider = (data.get("provider") or "unknown").strip().lower() if data.get("provider") else "unknown"
    model = data.get("model") or "estimated"
    input_tokens = int(data.get("inputTokens") or 0)
    output_tokens = int(data.get("outputTokens") or 0)
    total_tokens = int(data.get("totalTokens") or 0)
    ts = int(data.get("timestamp") or time.time() * 1000)
    url = data.get("url") or ""

    user_ref = db.collection("users").document(user_id)
    batch = db.batch()

    # 1) Append this event to the usage log
    usage_ref = user_ref.collection("usage").document()
    batch.set(usage_ref, {
        "provider": provider,
        "model": model,
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
        "timestamp": ts,
        "url": url,
        "createdAt": SERVER_TIMESTAMP,
    })

    # 2) Add to user's running total for frontend
    batch.update(user_ref, {
        "totalTokens": Increment(total_tokens),
        "updatedAt": SERVER_TIMESTAMP,
        f"totalByProvider.{provider}": Increment(total_tokens),
    })

    batch.commit()
    return jsonify({"ok": True}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
