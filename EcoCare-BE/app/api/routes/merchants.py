from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Merchant
from app.services import AIServingRepository, ArtifactUnavailableError, get_ai_serving_repository


def _price_from_db(m: Merchant) -> float:
    return float(m.price_from)

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

    open_now = db_merchant.open_now
    return {
        "merchant": {
            "merchantId": db_merchant.merchant_id,
            "merchantName": db_merchant.name,
            "merchantType": "",
            "merchantTypes": "",
            "address": db_merchant.address,
            "district": "",
            "latitude": db_merchant.lat,
            "longitude": db_merchant.lng,
            "rating": db_merchant.rating,
            "reviewCount": db_merchant.review_count,
            "priceFrom": _price_from_db(db_merchant),
            "openNow": open_now,
            "openState": "Open now" if open_now else "Status unknown",
            "hoursText": "",
            "phone": "",
            "website": "",
            "isValidGeo": True,
            "serviceTypes": list(db_merchant.service_types or []),
            "serviceFlags": {
                "exteriorWash": False,
                "interiorCleaning": False,
                "detailing": False,
                "ceramic": False,
                "evSafe": bool(db_merchant.is_ev_safe),
                "fastLane": False,
                "carSupported": True,
                "motorbikeSupported": False,
            },
            "ratingScore": None,
            "reviewVolumeScore": None,
            "trustScore": None,
            "openScore": None,
            "serviceRichnessScore": None,
            "baseRankScore": None,
            "unclaimedListing": False,
        }
    }
