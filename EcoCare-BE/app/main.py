from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import engine
from app.models import Base

settings = get_settings()

app = FastAPI(title=settings.app_name)


def _ensure_schema_patches() -> None:
    """Lightweight SQLite patches when ORM adds columns (create_all does not migrate)."""
    try:
        insp = inspect(engine)
        tables = insp.get_table_names()
        if "bookings" not in tables:
            return
        cols = {c["name"] for c in insp.get_columns("bookings")}
        stmts: list[str] = []
        if "vehicle_id" not in cols:
            stmts.append("ALTER TABLE bookings ADD COLUMN vehicle_id VARCHAR(64)")
        if not stmts:
            return
        with engine.begin() as conn:
            for sql in stmts:
                conn.execute(text(sql))
    except Exception:
        # Dev convenience: if inspect/alter fails, next request may still work on fresh DB
        pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://trinova.it.com",
        "https://api.trinova.it.com",
        "http://trinova.it.com",
        "http://api.trinova.it.com",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_schema_patches()


@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.app_env}


app.include_router(api_router, prefix=settings.api_prefix)
