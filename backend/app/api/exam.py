import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, parse_result_json, serialize_result
from app.db.database import ExamAttempt, ExamCase, Message, Scenario, Session as TrainingSession, get_db
from app.schemas.schemas import (
    ExamCaseResult,
    ExamFinishResponse,
    ExamResponse,
    ExamStartResponse,
    MessageResponse,
    SendMessageRequest,
    SessionResponse,
    TrainingFinishResponse,
)
from app.services.groq_service import groq_service

router = APIRouter(prefix="/api/exam", tags=["exam"])

EXAM_CASES_COUNT = 5


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


def _get_exam(exam_id: int, user_id: int, db: Session) -> ExamAttempt:
    exam = (
        db.query(ExamAttempt)
        .options(joinedload(ExamAttempt.cases).joinedload(ExamCase.session).joinedload(TrainingSession.scenario))
        .filter(ExamAttempt.id == exam_id, ExamAttempt.user_id == user_id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


async def _finish_case_session(session: TrainingSession, db: Session) -> dict:
    dialogue = [
        {"role": m.role, "content": m.content}
        for m in session.messages
        if m.role in ("user", "assistant")
    ]
    scenario = session.scenario
    evaluation = await groq_service.evaluate_dialogue(
        scenario.title,
        scenario.description,
        scenario.evaluation_criteria,
        dialogue,
    )
    score = float(evaluation.get("score", 5))
    session.status = "completed"
    session.score = score
    session.result_json = serialize_result(evaluation)
    session.completed_at = datetime.now(timezone.utc)
    return evaluation


@router.post("/start", response_model=ExamStartResponse)
async def start_exam(user=Depends(get_current_user), db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()  # noqa: E712
    if len(scenarios) < EXAM_CASES_COUNT:
        raise HTTPException(status_code=400, detail="Not enough active scenarios")

    selected = random.sample(scenarios, EXAM_CASES_COUNT)

    exam = ExamAttempt(user_id=user.id, status="in_progress")
    db.add(exam)
    db.flush()

    for idx, scenario in enumerate(selected):
        session = TrainingSession(
            user_id=user.id,
            scenario_id=scenario.id,
            type="exam",
            status="in_progress",
        )
        db.add(session)
        db.flush()

        initial = Message(session_id=session.id, role="assistant", content=scenario.initial_message)
        db.add(initial)

        exam_case = ExamCase(
            exam_attempt_id=exam.id,
            session_id=session.id,
            order_index=idx,
        )
        db.add(exam_case)

    db.commit()

    first_case = (
        db.query(ExamCase)
        .options(
            joinedload(ExamCase.session)
            .joinedload(TrainingSession.scenario),
            joinedload(ExamCase.session)
            .joinedload(TrainingSession.messages),
        )
        .filter(ExamCase.exam_attempt_id == exam.id, ExamCase.order_index == 0)
        .first()
    )

    return ExamStartResponse(
        exam_id=exam.id,
        case_number=1,
        total_cases=EXAM_CASES_COUNT,
        session=_session_to_response(first_case.session),
    )


@router.post("/{exam_id}/case/{session_id}/message", response_model=SessionResponse)
async def exam_send_message(
    exam_id: int,
    session_id: int,
    data: SendMessageRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, user.id, db)
    if exam.status != "in_progress":
        raise HTTPException(status_code=400, detail="Exam already completed")

    session = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
        .filter(TrainingSession.id == session_id, TrainingSession.user_id == user.id, TrainingSession.type == "exam")
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Case already completed")

    user_msg = Message(session_id=session.id, role="user", content=data.content)
    db.add(user_msg)
    db.flush()

    dialogue = [
        {"role": m.role, "content": m.content}
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


@router.post("/{exam_id}/case/{session_id}/finish", response_model=TrainingFinishResponse)
async def exam_finish_case(
    exam_id: int,
    session_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, user.id, db)
    session = (
        db.query(TrainingSession)
        .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
        .filter(TrainingSession.id == session_id, TrainingSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "completed":
        try:
            evaluation = await _finish_case_session(session, db)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Evaluation error: {str(e)}")

        exam_case = (
            db.query(ExamCase)
            .filter(ExamCase.exam_attempt_id == exam.id, ExamCase.session_id == session_id)
            .first()
        )
        if exam_case:
            exam_case.score = session.score
        db.commit()
    else:
        evaluation = parse_result_json(session.result_json) or {}

    return TrainingFinishResponse(
        session_id=session.id,
        score=session.score or 0,
        result=evaluation,
    )


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    exam = _get_exam(exam_id, user.id, db)

    cases = []
    current_case = None
    for case in sorted(exam.cases, key=lambda c: c.order_index):
        session = case.session
        result = parse_result_json(session.result_json) if session.result_json else {}
        cases.append(
            ExamCaseResult(
                case_number=case.order_index + 1,
                scenario_title=session.scenario.title if session.scenario else "",
                score=case.score or session.score or 0,
                verdict=result.get("verdict"),
            )
        )
        if session.status == "in_progress" and current_case is None:
            current_case = _session_to_response(session)

    return ExamResponse(
        id=exam.id,
        status=exam.status,
        average_score=exam.average_score,
        result_json=parse_result_json(exam.result_json),
        created_at=exam.created_at,
        completed_at=exam.completed_at,
        cases=cases,
        current_case=current_case,
    )


@router.post("/{exam_id}/finish", response_model=ExamFinishResponse)
async def finish_exam(exam_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    exam = _get_exam(exam_id, user.id, db)
    if exam.status == "completed":
        result = parse_result_json(exam.result_json) or {}
        cases = [
            ExamCaseResult(
                case_number=c.order_index + 1,
                scenario_title=c.session.scenario.title if c.session.scenario else "",
                score=c.score or 0,
            )
            for c in sorted(exam.cases, key=lambda x: x.order_index)
        ]
        return ExamFinishResponse(
            exam_id=exam.id,
            average_score=exam.average_score or 0,
            passed=(exam.average_score or 0) >= 7,
            result=result,
            cases=cases,
        )

    # Finish any in-progress cases
    for case in exam.cases:
        session = (
            db.query(TrainingSession)
            .options(joinedload(TrainingSession.scenario), joinedload(TrainingSession.messages))
            .filter(TrainingSession.id == case.session_id)
            .first()
        )
        if session and session.status != "completed":
            try:
                await _finish_case_session(session, db)
                case.score = session.score
            except Exception:
                case.score = 0
                session.status = "completed"
                session.score = 0

    scores = [c.score for c in exam.cases if c.score is not None]
    average = round(sum(scores) / len(scores), 1) if scores else 0
    passed = average >= 7

    case_results = []
    for case in sorted(exam.cases, key=lambda c: c.order_index):
        session = case.session
        result = parse_result_json(session.result_json) or {}
        case_results.append(
            {
                "scenario": session.scenario.title if session.scenario else "",
                "score": case.score,
                "verdict": result.get("verdict"),
                "mistakes": result.get("mistakes", []),
            }
        )

    try:
        summary = await groq_service.summarize_exam(case_results)
    except Exception:
        summary = {
            "summary": f"Средний балл зачёта: {average}. {'Зачёт сдан.' if passed else 'Зачёт не сдан.'}",
            "recommendations": ["Продолжайте тренироваться в слабых сценариях."],
            "weak_areas": [],
        }

    exam_result = {
        "average_score": average,
        "passed": passed,
        "cases": case_results,
        **summary,
    }

    exam.status = "completed"
    exam.average_score = average
    exam.result_json = serialize_result(exam_result)
    exam.completed_at = datetime.now(timezone.utc)
    db.commit()

    cases = [
        ExamCaseResult(
            case_number=c.order_index + 1,
            scenario_title=c.session.scenario.title if c.session.scenario else "",
            score=c.score or 0,
        )
        for c in sorted(exam.cases, key=lambda x: x.order_index)
    ]

    return ExamFinishResponse(
        exam_id=exam.id,
        average_score=average,
        passed=passed,
        result=exam_result,
        cases=cases,
    )
