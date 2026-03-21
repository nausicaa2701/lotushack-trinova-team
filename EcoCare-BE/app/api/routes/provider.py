from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Booking, CampaignRequest, Merchant, User
from app.schemas import CreateCampaignRequest, UpdateBookingStateRequest

router = APIRouter()


def _ensure_provider_access(provider_id: str, current_user: User) -> None:
    if current_user.id != provider_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")


@router.get("/{provider_id}/bookings")
def get_provider_bookings(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider_access(provider_id, current_user)

    items = db.scalars(select(Booking).where(Booking.provider_id == provider_id)).all()
    return {
        "providerBookings": [
            {
                "id": item.id,
                "providerId": provider_id,
                "owner": item.owner_id,
                "service": item.service,
                "state": item.state,
            }
            for item in items
        ]
    }


@router.patch("/{provider_id}/bookings/{booking_id}")
def update_provider_booking(
    provider_id: str,
    booking_id: str,
    payload: UpdateBookingStateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider_access(provider_id, current_user)

    booking = db.scalar(select(Booking).where(Booking.id == booking_id, Booking.provider_id == provider_id))
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking.state = payload.state
    db.commit()
    return {"updated": True, "bookingId": booking.id, "state": booking.state}


@router.get("/{provider_id}/campaign-requests")
def get_campaign_requests(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider_access(provider_id, current_user)

    items = db.scalars(select(CampaignRequest).where(CampaignRequest.provider_id == provider_id)).all()
    return {
        "campaignRequests": [
            {
                "id": item.id,
                "provider": item.provider,
                "type": item.type,
                "status": item.status,
            }
            for item in items
        ]
    }


@router.post("/{provider_id}/campaign-requests")
def create_campaign_request(
    provider_id: str,
    payload: CreateCampaignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider_access(provider_id, current_user)

    item = CampaignRequest(
        id=payload.id,
        provider_id=provider_id,
        provider=payload.provider,
        type=payload.type,
        status="pending",
    )
    db.merge(item)
    db.commit()

    return {"created": True, "id": item.id}


@router.get("/{provider_id}/ratings")
def get_provider_ratings(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider_access(provider_id, current_user)

    avg_rating, review_count, successful_orders = db.execute(
        select(
            func.coalesce(func.avg(Merchant.rating), 0),
            func.coalesce(func.sum(Merchant.review_count), 0),
            func.coalesce(func.sum(Merchant.successful_orders), 0),
        )
    ).one()

    return {
        "avgRating": round(float(avg_rating), 2),
        "reviewCount": int(review_count),
        "successfulOrders": int(successful_orders),
    }
