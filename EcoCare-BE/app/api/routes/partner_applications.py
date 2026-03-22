"""Public partner registration (demo — log only; extend with DB/email)."""

import time

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class PartnerApplicationIn(BaseModel):
    businessName: str = Field(..., min_length=1, max_length=255)
    contactPerson: str = Field(..., min_length=1, max_length=255)
    businessAddress: str = Field(..., min_length=1, max_length=512)
    phoneNumber: str = Field(..., min_length=3, max_length=64)
    businessLicenseNumber: str = Field(default="", max_length=128)
    washBays: str = Field(default="1-3", max_length=32)
    services: list[str] = Field(default_factory=list)


@router.post("/partner-applications")
def submit_partner_application(payload: PartnerApplicationIn) -> dict:
    # Dev: could persist PartnerApplication model + notify sales
    return {
        "ok": True,
        "id": f"pa-{int(time.time() * 1000)}",
        "message": "Application received. Our team will reach out within 48 hours.",
    }
