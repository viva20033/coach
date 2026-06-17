from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import Scenario, Session as TrainingSession, get_db
from app.schemas.schemas import ScenarioDetailResponse, ScenarioResponse

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioResponse])
def list_scenarios(
    search: str | None = Query(None),
    difficulty: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Scenario).filter(Scenario.is_active == True)  # noqa: E712

    if search:
        like = f"%{search}%"
        query = query.filter(
            (Scenario.title.ilike(like)) | (Scenario.description.ilike(like))
        )
    if difficulty:
        query = query.filter(Scenario.difficulty == difficulty)
    if category:
        query = query.filter(Scenario.category == category)

    scenarios = query.order_by(Scenario.id).all()

    if status and status != "new":
        completed_ids = {
            s.scenario_id
            for s in db.query(TrainingSession)
            .filter(
                TrainingSession.user_id == user.id,
                TrainingSession.status == "completed",
                TrainingSession.type == "training",
            )
            .all()
        }
        if status == "completed":
            scenarios = [s for s in scenarios if s.id in completed_ids]
        elif status == "favorite":
            # Favorites stored in localStorage on frontend; return all for now
            pass

    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioDetailResponse)
def get_scenario(
    scenario_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario
