from fastapi import APIRouter

from app.api.routes import admin, auth, forecast, merchants, owners, partner_applications, platform, provider, route_preview, search, slots

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(route_preview.router, prefix="/routes", tags=["routes"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(merchants.router, prefix="/merchants", tags=["merchants"])
api_router.include_router(slots.router, prefix="/slots", tags=["slots"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
api_router.include_router(partner_applications.router, tags=["partners"])
api_router.include_router(owners.router, prefix="/owners", tags=["owners"])
api_router.include_router(provider.router, prefix="/providers", tags=["providers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
