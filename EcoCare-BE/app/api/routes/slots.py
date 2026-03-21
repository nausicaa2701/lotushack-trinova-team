from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import SlotRecommendationRequest, SlotRecommendationResponse
from app.services import AIServingRepository, ArtifactUnavailableError, get_ai_serving_repository

router = APIRouter()


@router.post("/recommend", response_model=SlotRecommendationResponse)
def recommend_slots(
    payload: SlotRecommendationRequest,
    repo: AIServingRepository = Depends(get_ai_serving_repository),
):
    try:
        slots = repo.recommend_slots(
            merchant_id=payload.merchantId,
            search_timestamp=payload.searchTimestamp,
            preferred_date=payload.preferredDate,
            preferred_period=payload.preferredPeriod,
            search_mode=payload.searchMode,
        )
        return SlotRecommendationResponse(merchantId=payload.merchantId, slots=slots)
    except ArtifactUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
