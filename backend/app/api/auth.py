from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, user_stats
from app.config import settings
from app.db.database import User, get_db
from app.schemas.schemas import (
    DevLoginRequest,
    UserResponse,
    UserStatsResponse,
    UserWithStatsResponse,
)

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/dev-login", response_model=UserResponse)
def dev_login(data: DevLoginRequest, db: Session = Depends(get_db)):
    if not settings.dev_mode:
        raise HTTPException(status_code=403, detail="Dev login disabled")

    telegram_id = data.telegram_id or f"dev_{data.name.replace(' ', '_').lower()}"

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(
            name=data.name,
            telegram_id=telegram_id,
            username=data.username,
            role=data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.name = data.name
        if data.username:
            user.username = data.username
        if data.role:
            user.role = data.role
        db.commit()
        db.refresh(user)

    return user


@router.get("/me", response_model=UserWithStatsResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = user_stats(db, user.id)
    return UserWithStatsResponse(
        **UserResponse.model_validate(user).model_dump(),
        stats=UserStatsResponse(
            trainings=stats["trainings"],
            exams=stats["exams"],
            average_score=stats["average_score"],
            best_score=stats["best_score"],
            completion_rate=stats["completion_rate"],
        ),
    )
