from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import AIRollout, CampaignRequest, Dispute, MerchantApproval, RankingRule, User
from app.schemas import UpdateAIRolloutRequest, UpdateRankingRulesRequest, UpdateStatusRequest

router = APIRouter()


def _ensure_admin(current_user: User) -> None:
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/merchant-approvals")
def get_merchant_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    items = db.scalars(select(MerchantApproval)).all()
    return {
        "merchantApprovals": [
            {"id": item.id, "merchant": item.merchant, "city": item.city, "status": item.status}
            for item in items
        ]
    }


@router.patch("/merchant-approvals/{approval_id}")
def update_merchant_approval(
    approval_id: str,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(MerchantApproval, approval_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    item.status = payload.status
    db.commit()
    return {"updated": True, "id": item.id, "status": item.status}


@router.get("/campaign-moderation")
def get_campaign_moderation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    items = db.scalars(select(CampaignRequest)).all()
    return {
        "campaignModeration": [
            {"id": item.id, "provider": item.provider, "type": item.type, "status": item.status}
            for item in items
        ]
    }


@router.patch("/campaign-moderation/{campaign_id}")
def update_campaign_moderation(
    campaign_id: str,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(CampaignRequest, campaign_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign request not found")
    item.status = payload.status
    db.commit()
    return {"updated": True, "id": item.id, "status": item.status}


@router.get("/disputes")
def get_disputes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    items = db.scalars(select(Dispute)).all()
    return {
        "disputes": [
            {"id": item.id, "bookingId": item.booking_id, "type": item.type, "status": item.status}
            for item in items
        ]
    }


@router.patch("/disputes/{dispute_id}")
def update_dispute(
    dispute_id: str,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(Dispute, dispute_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
    item.status = payload.status
    db.commit()
    return {"updated": True, "id": item.id, "status": item.status}


@router.get("/ranking-rules")
def get_ranking_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(RankingRule, 1)
    if not item:
        item = RankingRule(id=1)
        db.add(item)
        db.commit()
        db.refresh(item)

    return {
        "routeMatchWeight": item.route_match_weight,
        "distanceDetourWeight": item.distance_detour_weight,
        "ratingWeight": item.rating_weight,
        "successfulOrderWeight": item.successful_order_weight,
        "slotAvailabilityWeight": item.slot_availability_weight,
        "priceFitWeight": item.price_fit_weight,
    }


@router.put("/ranking-rules")
def update_ranking_rules(
    payload: UpdateRankingRulesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(RankingRule, 1)
    if not item:
        item = RankingRule(id=1)
        db.add(item)

    item.route_match_weight = payload.routeMatchWeight
    item.distance_detour_weight = payload.distanceDetourWeight
    item.rating_weight = payload.ratingWeight
    item.successful_order_weight = payload.successfulOrderWeight
    item.slot_availability_weight = payload.slotAvailabilityWeight
    item.price_fit_weight = payload.priceFitWeight

    db.commit()
    return {"updated": True}


@router.get("/ai-rollout")
def get_ai_rollout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(AIRollout, 1)
    if not item:
        item = AIRollout(id=1)
        db.add(item)
        db.commit()
        db.refresh(item)

    return {
        "rankingModel": {
            "status": item.ranking_model_status,
            "ndcg10": item.ranking_model_ndcg10,
            "recall10": item.ranking_model_recall10,
        },
        "slotModel": {
            "status": item.slot_model_status,
            "top3HitRate": item.slot_model_top3_hit_rate,
            "auc": item.slot_model_auc,
        },
        "fallbackHealthy": item.fallback_healthy,
    }


@router.patch("/ai-rollout")
def update_ai_rollout(
    payload: UpdateAIRolloutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    item = db.get(AIRollout, 1)
    if not item:
        item = AIRollout(id=1)
        db.add(item)

    if payload.rankingModelStatus is not None:
        item.ranking_model_status = payload.rankingModelStatus
    if payload.slotModelStatus is not None:
        item.slot_model_status = payload.slotModelStatus
    if payload.fallbackHealthy is not None:
        item.fallback_healthy = payload.fallbackHealthy

    db.commit()
    return {"updated": True}
