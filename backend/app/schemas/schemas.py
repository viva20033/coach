from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# --- Auth / User ---

class DevLoginRequest(BaseModel):
    name: str = "Тестовый менеджер"
    telegram_id: str | None = None
    username: str | None = None
    role: Literal["manager", "mentor", "admin"] = "manager"


class UserResponse(BaseModel):
    id: int
    name: str
    telegram_id: str | None
    username: str | None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserStatsResponse(BaseModel):
    trainings: int
    exams: int
    average_score: float | None
    best_score: float | None
    completion_rate: float | None


class UserWithStatsResponse(UserResponse):
    stats: UserStatsResponse


# --- Scenarios ---

class ScenarioResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    client_role: str
    initial_message: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ScenarioDetailResponse(ScenarioResponse):
    ai_behavior_prompt: str
    evaluation_criteria: str | None


class ScenarioCreate(BaseModel):
    title: str
    description: str
    category: str
    difficulty: Literal["easy", "medium", "hard"]
    client_role: str
    initial_message: str
    ai_behavior_prompt: str
    evaluation_criteria: str | None = None
    is_active: bool = True


class ScenarioUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    difficulty: Literal["easy", "medium", "hard"] | None = None
    client_role: str | None = None
    initial_message: str | None = None
    ai_behavior_prompt: str | None = None
    evaluation_criteria: str | None = None
    is_active: bool | None = None


# --- Messages ---

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)


# --- Sessions / Training ---

class TrainingStartRequest(BaseModel):
    scenario_id: int


class SessionResponse(BaseModel):
    id: int
    user_id: int
    scenario_id: int
    type: str
    status: str
    score: float | None
    result_json: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None
    scenario: ScenarioResponse | None = None
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class TrainingFinishResponse(BaseModel):
    session_id: int
    score: float
    result: dict[str, Any]


# --- Exam ---

class ExamStartResponse(BaseModel):
    exam_id: int
    case_number: int
    total_cases: int
    session: SessionResponse


class ExamCaseResult(BaseModel):
    case_number: int
    scenario_title: str
    score: float
    verdict: str | None = None


class ExamResponse(BaseModel):
    id: int
    status: str
    average_score: float | None
    result_json: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None
    cases: list[ExamCaseResult] = []
    current_case: SessionResponse | None = None


class ExamFinishResponse(BaseModel):
    exam_id: int
    average_score: float
    passed: bool
    result: dict[str, Any]
    cases: list[ExamCaseResult]


# --- History ---

class HistoryItemResponse(BaseModel):
    id: int
    scenario_title: str
    scenario_difficulty: str
    type: str
    status: str
    score: float | None
    created_at: datetime
    completed_at: datetime | None
    exam_id: int | None = None


class HistoryDetailResponse(SessionResponse):
    scenario_title: str
    scenario_difficulty: str
    scenario_category: str


# --- Admin ---

class AdminUserResponse(BaseModel):
    id: int
    name: str
    telegram_id: str | None
    username: str | None
    role: str
    created_at: datetime
    trainings_count: int
    exams_count: int
    average_score: float | None

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    role: Literal["manager", "mentor", "admin"]


class AdminResultItem(BaseModel):
    session_id: int
    user_id: int
    user_name: str
    scenario_id: int
    scenario_title: str
    scenario_difficulty: str
    scenario_category: str
    type: str
    score: float | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    result_json: dict[str, Any] | None = None


class AdminResultDetailResponse(AdminResultItem):
    messages: list[MessageResponse] = []


class AdminResultsResponse(BaseModel):
    items: list[AdminResultItem]
    average_score: float | None
    total: int


class DashboardStats(BaseModel):
    total_trainings: int
    completed_trainings: int
    average_score: float | None
    completion_rate: float


class FavoriteToggle(BaseModel):
    scenario_id: int
