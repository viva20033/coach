from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, parse_result_json
from app.db.database import ExamCase, Session as TrainingSession, get_db
from app.schemas.schemas import HistoryDetailResponse, HistoryItemResponse, MessageResponse, SessionResponse

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryItemResponse])
def get_history(user=Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario))
        .filter(TrainingSession.user_id == user.id)
        .order_by(TrainingSession.created_at.desc())
        .all()
    )

    exam_case_map = {}
    exam_cases = (
        db.query(ExamCase)
        .filter(ExamCase.session_id.in_([s.id for s in sessions]))
        .all()
    )
    for ec in exam_cases:
        exam_case_map[ec.session_id] = ec.exam_attempt_id

    items = []
    for s in sessions:
        items.append(
            HistoryItemResponse(
                id=s.id,
                scenario_title=s.scenario.title if s.scenario else "—",
                scenario_difficulty=s.scenario.difficulty if s.scenario else "—",
                type=s.type,
                status=s.status,
                score=s.score,
                created_at=s.created_at,
                completed_at=s.completed_at,
                exam_id=exam_case_map.get(s.id),
            )
        )
    return items


@router.get("/{session_id}", response_model=HistoryDetailResponse)
def get_history_detail(
    session_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
        .filter(TrainingSession.id == session_id, TrainingSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return HistoryDetailResponse(
        id=session.id,
        user_id=session.user_id,
        scenario_id=session.scenario_id,
        type=session.type,
        status=session.status,
        score=session.score,
        result_json=parse_result_json(session.result_json),
        created_at=session.created_at,
        completed_at=session.completed_at,
        scenario=session.scenario,
        messages=[MessageResponse.model_validate(m) for m in session.messages],
        scenario_title=session.scenario.title if session.scenario else "",
        scenario_difficulty=session.scenario.difficulty if session.scenario else "",
        scenario_category=session.scenario.category if session.scenario else "",
    )
