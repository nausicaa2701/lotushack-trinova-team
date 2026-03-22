"""Rules for wash booking uniqueness (same calendar day + same time slot in Asia/Ho_Chi_Minh)."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")
UTC = ZoneInfo("UTC")

_CANCELLED = frozenset({"cancelled", "no_show"})


def slot_identity_key(*, slot_stored: str, created_at: datetime | None = None) -> str:
    """
    Stable key: ``YYYY-MM-DD|HH:MM`` in Vietnam time for ISO slots, or
    ``YYYY-MM-DD|NEXT`` for generic 'next available' style slots.
    """
    s = (slot_stored or "").strip()
    if not s:
        return ""
    low = s.lower().replace(" ", "")
    if low in ("nextavailable", "next"):
        base = created_at or datetime.now(tz=UTC)
        if created_at is not None and created_at.tzinfo is None:
            base = created_at.replace(tzinfo=UTC)
        vn = base.astimezone(VN_TZ)
        return f"{vn.strftime('%Y-%m-%d')}|NEXT"
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        vn = dt.astimezone(VN_TZ)
        return f"{vn.strftime('%Y-%m-%d')}|{vn.strftime('%H:%M')}"
    except (ValueError, TypeError, OSError):
        return s[:160]


def stored_slot_and_key(*, slot_time_iso: str | None, slot_label: str | None) -> tuple[str, str]:
    """Returns ``(value to persist in Booking.slot, identity_key)``."""
    if slot_time_iso and slot_time_iso.strip():
        raw = slot_time_iso.strip()[:500]
        try:
            datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return raw, slot_identity_key(slot_stored=raw)
        except (ValueError, TypeError, OSError):
            pass
    fb = (slot_label or "Next available").strip()[:500] or "Next available"
    now_vn = datetime.now(tz=VN_TZ)
    return fb, f"{now_vn.strftime('%Y-%m-%d')}|NEXT"


def conflicts_with_existing(*, new_key: str, existing_slot: str, existing_state: str, existing_created_at: datetime | None) -> bool:
    if not new_key or existing_state in _CANCELLED:
        return False
    old_key = slot_identity_key(slot_stored=existing_slot, created_at=existing_created_at)
    return bool(old_key) and old_key == new_key
