from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, SwitchRoleRequest, UserOut

router = APIRouter()

@router.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "EcoCare Backend"}


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return {
        "token": f"token_{user.id}",
        "refreshToken": f"refresh_{user.id}",
        "user": UserOut.model_validate(user),
    }


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/switch-role")
def switch_role(payload: SwitchRoleRequest, current_user: User = Depends(get_current_user)):
    if payload.role not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role not available for this user")

    return {"activeRole": payload.role}
