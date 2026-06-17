import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.api.deps import parse_result_json, require_admin, user_stats
from app.db.database import Scenario, Session as TrainingSession, User, get_db
from app.schemas.schemas import (
    AdminResultDetailResponse,
    AdminResultItem,
    AdminResultsResponse,
    AdminUserResponse,
    AdminUserUpdate,
    MessageResponse,
    ScenarioCreate,
    ScenarioDetailResponse,
    ScenarioResponse,
    ScenarioUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# --- Users ---

@router.get("/users", response_model=list[AdminUserResponse])
def list_users(admin=Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    result = []
    for u in users:
        stats = user_stats(db, u.id)
        result.append(
            AdminUserResponse(
                id=u.id,
                name=u.name,
                telegram_id=u.telegram_id,
                username=u.username,
                role=u.role,
                created_at=u.created_at,
                trainings_count=stats["trainings"],
                exams_count=stats["exams"],
                average_score=stats["average_score"],
            )
        )
    return result


@router.put("/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    db.refresh(user)
    stats = user_stats(db, user.id)
    return AdminUserResponse(
        id=user.id,
        name=user.name,
        telegram_id=user.telegram_id,
        username=user.username,
        role=user.role,
        created_at=user.created_at,
        trainings_count=stats["trainings"],
        exams_count=stats["exams"],
        average_score=stats["average_score"],
    )


# --- Scenarios ---

@router.get("/scenarios", response_model=list[ScenarioDetailResponse])
def admin_list_scenarios(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Scenario).order_by(Scenario.id).all()


@router.post("/scenarios", response_model=ScenarioDetailResponse)
def create_scenario(
    data: ScenarioCreate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    scenario = Scenario(**data.model_dump())
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.put("/scenarios/{scenario_id}", response_model=ScenarioDetailResponse)
def update_scenario(
    scenario_id: int,
    data: ScenarioUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(scenario, key, value)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.delete("/scenarios/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(scenario)
    db.commit()
    return {"ok": True}


# --- Results ---

@router.get("/results", response_model=AdminResultsResponse)
def get_results(
    user_id: int | None = Query(None),
    scenario_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.user), joinedload(TrainingSession.scenario))
        .filter(TrainingSession.status == "completed")
    )
    if user_id:
        query = query.filter(TrainingSession.user_id == user_id)
    if scenario_id:
        query = query.filter(TrainingSession.scenario_id == scenario_id)
    if date_from:
        query = query.filter(TrainingSession.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(TrainingSession.created_at <= datetime.fromisoformat(date_to))

    sessions = query.order_by(TrainingSession.created_at.desc()).all()
    scores = [s.score for s in sessions if s.score is not None]

    items = [
        AdminResultItem(
            session_id=s.id,
            user_id=s.user_id,
            user_name=s.user.name if s.user else "",
            scenario_id=s.scenario_id,
            scenario_title=s.scenario.title if s.scenario else "",
            scenario_difficulty=s.scenario.difficulty if s.scenario else "",
            scenario_category=s.scenario.category if s.scenario else "",
            type=s.type,
            score=s.score,
            status=s.status,
            created_at=s.created_at,
            completed_at=s.completed_at,
            result_json=parse_result_json(s.result_json),
        )
        for s in sessions
    ]

    return AdminResultsResponse(
        items=items,
        average_score=round(sum(scores) / len(scores), 1) if scores else None,
        total=len(items),
    )


@router.get("/results/{session_id}", response_model=AdminResultDetailResponse)
def get_result_detail(
    session_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    session = (
        db.query(TrainingSession)
        .options(
            joinedload(TrainingSession.user),
            joinedload(TrainingSession.scenario),
            joinedload(TrainingSession.messages),
        )
        .filter(TrainingSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return AdminResultDetailResponse(
        session_id=session.id,
        user_id=session.user_id,
        user_name=session.user.name if session.user else "",
        scenario_id=session.scenario_id,
        scenario_title=session.scenario.title if session.scenario else "",
        scenario_difficulty=session.scenario.difficulty if session.scenario else "",
        scenario_category=session.scenario.category if session.scenario else "",
        type=session.type,
        score=session.score,
        status=session.status,
        created_at=session.created_at,
        completed_at=session.completed_at,
        result_json=parse_result_json(session.result_json),
        messages=[MessageResponse.model_validate(m) for m in session.messages],
    )


@router.get("/results/export.csv")
def export_results_csv(
    user_id: int | None = Query(None),
    scenario_id: int | None = Query(None),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.user), joinedload(TrainingSession.scenario))
        .filter(TrainingSession.status == "completed")
    )
    if user_id:
        query = query.filter(TrainingSession.user_id == user_id)
    if scenario_id:
        query = query.filter(TrainingSession.scenario_id == scenario_id)

    sessions = query.order_by(TrainingSession.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "session_id", "user_name", "scenario", "category", "difficulty",
        "type", "score", "status", "created_at", "verdict",
        "strengths", "mistakes", "recommendations",
    ])
    for s in sessions:
        result = parse_result_json(s.result_json) or {}
        writer.writerow([
            s.id,
            s.user.name if s.user else "",
            s.scenario.title if s.scenario else "",
            s.scenario.category if s.scenario else "",
            s.scenario.difficulty if s.scenario else "",
            s.type,
            s.score,
            s.status,
            s.created_at.isoformat() if s.created_at else "",
            result.get("verdict", ""),
            "; ".join(result.get("strengths", [])),
            "; ".join(result.get("mistakes", [])),
            "; ".join(result.get("recommendations", [])),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
