from fastapi import APIRouter, Depends, HTTPException, status

from app.services import AIServingRepository, ArtifactUnavailableError, get_ai_serving_repository

router = APIRouter()


@router.get("/zones/{zone_id}")
def get_zone_forecast(
    zone_id: str,
    repo: AIServingRepository = Depends(get_ai_serving_repository),
):
    try:
        forecasts = repo.forecast_for_zone(zone_id)
    except ArtifactUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not forecasts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone forecast not found")

    return {"zone": zone_id, "forecasts": forecasts}


@router.get("/summary")
def get_forecast_summary(repo: AIServingRepository = Depends(get_ai_serving_repository)):
    try:
        return {"summary": repo.forecast_summary()}
    except ArtifactUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
