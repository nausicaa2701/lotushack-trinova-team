from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Merchant
from app.services import AIServingRepository, ArtifactUnavailableError, get_ai_serving_repository

router = APIRouter()


@router.get("/{merchant_id}")
def get_merchant_detail(
    merchant_id: str,
    db: Session = Depends(get_db),
    repo: AIServingRepository = Depends(get_ai_serving_repository),
):
    try:
        merchant = repo.merchant_detail(merchant_id)
        if merchant:
            return {"merchant": merchant}
    except ArtifactUnavailableError:
        pass

    db_merchant = db.scalar(select(Merchant).where(Merchant.merchant_id == merchant_id))
    if not db_merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")

    return {
        "merchant": {
            "merchantId": db_merchant.merchant_id,
            "merchantName": db_merchant.name,
            "address": db_merchant.address,
            "latitude": db_merchant.lat,
            "longitude": db_merchant.lng,
            "rating": db_merchant.rating,
            "reviewCount": db_merchant.review_count,
            "openNow": db_merchant.open_now,
            "openState": "open_now" if db_merchant.open_now else "unknown",
            "serviceTypes": db_merchant.service_types,
            "serviceFlags": {},
            "baseRankScore": None,
        }
    }
