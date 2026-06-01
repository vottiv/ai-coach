from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.exercises.router import router as exercises_router
from app.modules.health.router import router as health_router
from app.modules.insights.router import router as insights_router
from app.modules.measurements.router import router as measurements_router
from app.modules.nutrition.router import router as nutrition_router
from app.modules.subjective.router import router as subjective_router
from app.modules.users.router import router as users_router
from app.modules.workouts.router import router as workouts_router

app = FastAPI(title=settings.app_name, docs_url="/docs", openapi_url="/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


# Каждый модуль подключается одним include_router (см. ТЗ п. 2.2 / п. 10 — модульность).
api = APIRouter(prefix="/api/v1")
api.include_router(auth_router)
api.include_router(users_router)
api.include_router(exercises_router)
api.include_router(workouts_router)
api.include_router(nutrition_router)
api.include_router(subjective_router)
api.include_router(health_router)
api.include_router(insights_router)
api.include_router(measurements_router)
app.include_router(api)
