import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, exam, history, scenarios, training
from app.config import settings
from app.db.database import Scenario, User, init_db
from app.db.seed import SEED_SCENARIOS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("izo_coach")


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

if settings.dev_mode:
    # LAN demo + explicit production origins from CORS_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
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
    key = settings.groq_api_key
    groq_ok = bool(key and key not in ("", "your_groq_api_key_here"))
    return {
        "status": "ok",
        "groq_configured": groq_ok,
        "groq_model": settings.groq_model,
    }
