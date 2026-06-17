import json
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import User, get_db


def get_current_user(
    x_user_id: int | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def parse_result_json(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def serialize_result(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False)


def user_stats(db: Session, user_id: int) -> dict:
    from app.db.database import ExamAttempt, Session as TrainingSession

    trainings = (
        db.query(TrainingSession)
        .filter(TrainingSession.user_id == user_id, TrainingSession.type == "training")
        .all()
    )
    exams = db.query(ExamAttempt).filter(ExamAttempt.user_id == user_id).all()
    completed = [s for s in trainings if s.status == "completed"]
    scores = [s.score for s in completed if s.score is not None]
    exam_scores = [e.average_score for e in exams if e.average_score is not None]
    all_scores = scores + exam_scores

    return {
        "trainings": len(trainings),
        "exams": len(exams),
        "average_score": round(sum(all_scores) / len(all_scores), 1) if all_scores else None,
        "best_score": max(all_scores) if all_scores else None,
        "completion_rate": round(len(completed) / len(trainings) * 100, 1) if trainings else None,
        "total_trainings": len(trainings),
        "completed_trainings": len(completed),
    }
