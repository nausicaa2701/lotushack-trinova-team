from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import engine
from app.models import Base

settings = get_settings()

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.app_env}


app.include_router(api_router, prefix=settings.api_prefix)
