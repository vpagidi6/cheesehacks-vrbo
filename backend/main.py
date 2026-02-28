import os
from datetime import datetime, timezone
from typing import Any, Literal

import firebase_admin
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, firestore
from pydantic import BaseModel, Field


app = FastAPI(title="Sustainability Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db: firestore.Client | None = None


def _find_service_account_path() -> str:
    env_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if env_path and os.path.exists(env_path):
        return env_path

    local_paths = [
        os.path.join(os.getcwd(), "serviceAccount.json"),
        os.path.join(os.path.dirname(__file__), "serviceAccount.json"),
    ]
    for path in local_paths:
        if os.path.exists(path):
            return path

    raise RuntimeError(
        "Firebase service account not found. Set GOOGLE_APPLICATION_CREDENTIALS or add backend/serviceAccount.json"
    )


def get_db() -> firestore.Client:
    global db
    if db is not None:
        return db

    if not firebase_admin._apps:
        service_account_path = _find_service_account_path()
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    return db


def _parse_iso_timestamp(ts: str) -> datetime:
    normalized = ts.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid ts. Expected ISO timestamp") from exc

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _month_bounds(month: str) -> tuple[str, str]:
    try:
        start_dt = datetime.strptime(month, "%Y-%m")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid month. Expected YYYY-MM") from exc

    year = start_dt.year
    month_num = start_dt.month

    if month_num == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month_num + 1, 1)

    start_str = f"{year:04d}-{month_num:02d}-01"
    end_str = f"{next_month.year:04d}-{next_month.month:02d}-01"
    return start_str, end_str


class IngestRequest(BaseModel):
    user: str = Field(min_length=3)
    provider: str
    ts: str
    tokens: int = Field(ge=0)
    ml: float = Field(ge=0)
    eventHash: str = Field(min_length=1)


class SettingsRequest(BaseModel):
    user: str = Field(min_length=3)
    dailyLimitMl: float = Field(ge=0)
    estimationMode: Literal["low", "conservative", "range"]


@app.post("/api/ingest")
async def ingest_event(payload: IngestRequest) -> dict[str, bool]:
    firestore_db = get_db()

    ts_dt = _parse_iso_timestamp(payload.ts)
    date_str = ts_dt.date().isoformat()

    user_ref = firestore_db.collection("users").document(payload.user)
    event_ref = user_ref.collection("events").document(payload.eventHash)
    daily_ref = user_ref.collection("daily").document(date_str)

    transaction = firestore_db.transaction()

    @firestore.transactional
    def write_ingest(txn: firestore.Transaction) -> bool:
        existing_event = event_ref.get(transaction=txn)
        if existing_event.exists:
            return False

        txn.set(
            event_ref,
            {
                "provider": payload.provider,
                "ts": ts_dt.isoformat().replace("+00:00", "Z"),
                "tokens": payload.tokens,
                "ml": payload.ml,
            },
        )

        daily_snapshot = daily_ref.get(transaction=txn)
        if daily_snapshot.exists:
            daily_data: dict[str, Any] = daily_snapshot.to_dict() or {}
        else:
            daily_data = {
                "date": date_str,
                "ml": 0.0,
                "tokens": 0,
                "byProvider": {
                    "chatgpt": 0.0,
                    "claude": 0.0,
                    "gemini": 0.0,
                },
            }

        by_provider = daily_data.get("byProvider") or {}
        current_provider_total = float(by_provider.get(payload.provider, 0.0))
        by_provider[payload.provider] = current_provider_total + payload.ml

        updated_daily = {
            "date": date_str,
            "ml": float(daily_data.get("ml", 0.0)) + payload.ml,
            "tokens": int(daily_data.get("tokens", 0)) + payload.tokens,
            "byProvider": by_provider,
        }

        txn.set(daily_ref, updated_daily)
        return True

    write_ingest(transaction)
    return {"ok": True}


@app.get("/api/summary")
async def get_summary(
    user: str = Query(..., min_length=3),
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
) -> dict[str, Any]:
    firestore_db = get_db()
    user_ref = firestore_db.collection("users").document(user)

    settings_ref = user_ref.collection("settings").document("main")
    settings_snap = settings_ref.get()
    settings = settings_snap.to_dict() if settings_snap.exists else {}

    daily_limit_ml = float(settings.get("dailyLimitMl", 500))
    estimation_mode = settings.get("estimationMode", "range")
    if estimation_mode not in {"low", "conservative", "range"}:
        estimation_mode = "range"

    start_date, end_date = _month_bounds(month)

    month_query = (
        user_ref.collection("daily")
        .where("date", ">=", start_date)
        .where("date", "<", end_date)
        .order_by("date")
    )
    month_docs = list(month_query.stream())

    month_days: list[dict[str, Any]] = []
    by_provider: dict[str, float] = {"chatgpt": 0.0, "claude": 0.0, "gemini": 0.0}

    for doc in month_docs:
        data = doc.to_dict() or {}
        day_date = data.get("date", doc.id)
        day_ml = float(data.get("ml", 0.0))
        day_tokens = int(data.get("tokens", 0))
        month_days.append({"date": day_date, "ml": day_ml, "tokens": day_tokens})

        providers = data.get("byProvider") or {}
        for provider_name, value in providers.items():
            by_provider[provider_name] = float(by_provider.get(provider_name, 0.0)) + float(value or 0.0)

    today_str = datetime.now(timezone.utc).date().isoformat()
    today_snap = user_ref.collection("daily").document(today_str).get()
    today_data = today_snap.to_dict() if today_snap.exists else {}

    today = {
        "date": today_str,
        "ml": float(today_data.get("ml", 0.0)),
        "tokens": int(today_data.get("tokens", 0)),
    }

    return {
        "today": today,
        "dailyLimitMl": daily_limit_ml,
        "estimationMode": estimation_mode,
        "monthDays": month_days,
        "byProvider": by_provider,
    }


@app.post("/api/settings")
async def save_settings(payload: SettingsRequest) -> dict[str, bool]:
    firestore_db = get_db()
    settings_ref = (
        firestore_db.collection("users")
        .document(payload.user)
        .collection("settings")
        .document("main")
    )

    settings_ref.set(
        {
            "dailyLimitMl": payload.dailyLimitMl,
            "estimationMode": payload.estimationMode,
        }
    )
    return {"ok": True}
