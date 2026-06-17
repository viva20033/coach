from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, exam, history, scenarios, training
from app.config import settings
from app.db.database import Scenario, User, init_db
from app.db.seed import SEED_SCENARIOS


def seed_database():
    from app.db.database import SessionLocal

    db = SessionLocal()
    try:
        if db.query(Scenario).count() == 0:
            for s in SEED_SCENARIOS:
                db.add(Scenario(**s, is_active=True))
            db.commit()

        # Create default admin user for dev
        if settings.dev_mode and not db.query(User).filter(User.role == "admin").first():
            db.add(
                User(
                    name="Администратор",
                    telegram_id="dev_admin",
                    username="admin",
                    role="admin",
                )
            )
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_database()
    yield


app = FastAPI(title="IZO Coach API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scenarios.router)
app.include_router(training.router)
app.include_router(exam.router)
app.include_router(history.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
