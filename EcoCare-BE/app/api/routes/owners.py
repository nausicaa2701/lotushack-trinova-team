from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Booking, Merchant, User
from app.schemas import BookingOut, CreateBookingRequest, UpdateBookingStateRequest
from app.services.booking_rules import conflicts_with_existing, stored_slot_and_key

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
        "createdAt": booking.created_at.isoformat() + ("Z" if booking.created_at.tzinfo is None else ""),
        "vehicleId": booking.vehicle_id,
    }


@router.get("/{owner_id}/bookings")
def get_owner_bookings(
    owner_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != owner_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    bookings = db.scalars(
        select(Booking).where(Booking.owner_id == owner_id).order_by(Booking.created_at.desc())
    ).all()
    return {"bookings": [_booking_to_response(item) for item in bookings]}


@router.post("/{owner_id}/bookings", response_model=BookingOut)
def create_owner_booking(
    owner_id: str,
    payload: CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime

    if current_user.id != owner_id and "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    booking_id = payload.id or f"bk-{int(datetime.now().timestamp() * 1000)}"

    provider = payload.provider
    provider_id = None
    service = payload.service or (payload.service_type + " wash" if payload.service_type else "Eco wash")
    price = float(payload.price or 0.0)

    slot_time_iso = (payload.slot_time or "").strip() or None
    slot_label = (payload.slot or "").strip() or None
    stored_slot, new_key = stored_slot_and_key(slot_time_iso=slot_time_iso, slot_label=slot_label)

    if payload.merchant_id:
        merchant = db.get(Merchant, payload.merchant_id)
        if merchant:
            provider = merchant.name
            all_users = db.scalars(select(User)).all()
            for user in all_users:
                if "provider" in user.roles:
                    provider_id = user.id
                    break

    existing = db.scalars(select(Booking).where(Booking.owner_id == owner_id)).all()
    for row in existing:
        if conflicts_with_existing(
            new_key=new_key,
            existing_slot=row.slot,
            existing_state=row.state,
            existing_created_at=row.created_at,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a wash booked for this date and time slot. Choose another slot or cancel the existing booking first.",
            )

    booking = Booking(
        id=booking_id,
        owner_id=owner_id,
        provider_id=provider_id,
        provider=provider or "Unknown Provider",
        service=service,
        slot=stored_slot,
        state="confirmed",
        price=price,
        vehicle_id=(payload.vehicle_id or "").strip() or None,
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
