from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Booking, User
from app.schemas import BookingOut, CreateBookingRequest, UpdateBookingStateRequest

router = APIRouter()


def _booking_to_response(booking: Booking) -> dict:
    return {
        "id": booking.id,
        "ownerId": booking.owner_id,
        "providerId": booking.provider_id,
        "provider": booking.provider,
        "service": booking.service,
        "slot": booking.slot,
        "state": booking.state,
        "price": float(booking.price) if isinstance(booking.price, Decimal) else booking.price,
    }


@router.get("/{owner_id}/bookings")
def get_owner_bookings(
    owner_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != owner_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    bookings = db.scalars(select(Booking).where(Booking.owner_id == owner_id)).all()
    return {"bookings": [_booking_to_response(item) for item in bookings]}


@router.post("/{owner_id}/bookings", response_model=BookingOut)
def create_owner_booking(
    owner_id: str,
    payload: CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != owner_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    provider_id: str | None = payload.providerId
    if provider_id:
        provider_user = db.get(User, provider_id)
        if not provider_user:
            # Frontend may send merchant IDs here; do not fail with FK errors.
            provider_id = None

    booking = Booking(
        id=payload.id,
        owner_id=owner_id,
        provider_id=provider_id,
        provider=payload.provider,
        service=payload.service,
        slot=payload.slot,
        state="confirmed",
        price=payload.price,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return BookingOut.model_validate(booking)


@router.patch("/{owner_id}/bookings/{booking_id}")
def update_owner_booking(
    owner_id: str,
    booking_id: str,
    payload: UpdateBookingStateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != owner_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    booking = db.scalar(select(Booking).where(Booking.id == booking_id, Booking.owner_id == owner_id))
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking.state = payload.state
    db.commit()

    return {"updated": True, "bookingId": booking.id, "state": booking.state}
