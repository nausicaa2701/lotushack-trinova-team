from fastapi import APIRouter

from app.api.routes import admin, auth, owners, provider, route_preview, search

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(route_preview.router, prefix="/routes", tags=["routes"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(owners.router, prefix="/owners", tags=["owners"])
api_router.include_router(provider.router, prefix="/providers", tags=["providers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
