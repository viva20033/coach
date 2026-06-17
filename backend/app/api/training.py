import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, parse_result_json, serialize_result
from app.db.database import Message, Scenario, Session as TrainingSession, get_db
from app.schemas.schemas import (
    MessageResponse,
    SendMessageRequest,
    SessionResponse,
    TrainingFinishResponse,
    TrainingStartRequest,
)
from app.services.groq_service import groq_service

router = APIRouter(prefix="/api/training", tags=["training"])


def _session_to_response(session: TrainingSession) -> SessionResponse:
    return SessionResponse(
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
    )


@router.post("/start", response_model=SessionResponse)
async def start_training(
    data: TrainingStartRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scenario = db.query(Scenario).filter(Scenario.id == data.scenario_id, Scenario.is_active == True).first()  # noqa: E712
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session = TrainingSession(
        user_id=user.id,
        scenario_id=scenario.id,
        type="training",
        status="in_progress",
    )
    db.add(session)
    db.flush()

    initial = Message(
        session_id=session.id,
        role="assistant",
        content=scenario.initial_message,
    )
    db.add(initial)
    db.commit()

    session = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
        .filter(TrainingSession.id == session.id)
        .first()
    )
    return _session_to_response(session)


@router.post("/{session_id}/message", response_model=SessionResponse)
async def send_message(
    session_id: int,
    data: SendMessageRequest,
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
    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Session already completed")

    user_msg = Message(session_id=session.id, role="user", content=data.content)
    db.add(user_msg)
    db.flush()

    dialogue = [
        {"role": m.role if m.role != "assistant" else "assistant", "content": m.content}
        for m in session.messages
        if m.role in ("user", "assistant")
    ]
    dialogue.append({"role": "user", "content": data.content})

    scenario = session.scenario
    try:
        ai_response = await groq_service.get_client_response(
            scenario.title,
            scenario.description,
            scenario.client_role,
            scenario.ai_behavior_prompt,
            dialogue,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    assistant_msg = Message(session_id=session.id, role="assistant", content=ai_response)
    db.add(assistant_msg)
    db.commit()

    session = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
        .filter(TrainingSession.id == session_id)
        .first()
    )
    return _session_to_response(session)


@router.post("/{session_id}/finish", response_model=TrainingFinishResponse)
async def finish_training(
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
    if session.status == "completed":
        result = parse_result_json(session.result_json) or {}
        return TrainingFinishResponse(session_id=session.id, score=session.score or 0, result=result)

    dialogue = [
        {"role": m.role, "content": m.content}
        for m in session.messages
        if m.role in ("user", "assistant")
    ]
    scenario = session.scenario

    try:
        evaluation = await groq_service.evaluate_dialogue(
            scenario.title,
            scenario.description,
            scenario.evaluation_criteria,
            dialogue,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Evaluation error: {str(e)}")

    score = float(evaluation.get("score", 5))
    session.status = "completed"
    session.score = score
    session.result_json = serialize_result(evaluation)
    session.completed_at = datetime.now(timezone.utc)
    db.commit()

    return TrainingFinishResponse(session_id=session.id, score=score, result=evaluation)


@router.get("/{session_id}", response_model=SessionResponse)
def get_training_session(
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
    return _session_to_response(session)
