import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, me, programs, workout

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)

app = FastAPI(title="Gym Progression API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(programs.router, prefix="/api/v1/programs", tags=["programs"])
app.include_router(me.router, prefix="/api/v1/me", tags=["me"])
app.include_router(workout.router, prefix="/api/v1/me/workout", tags=["workout"])
