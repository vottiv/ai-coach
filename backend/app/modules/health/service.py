import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.crypto import encrypt
from app.models.health import Biomarker, HealthAnalysis
from app.modules.health.schemas import BiomarkerIn, HealthCreate


def compute_status(value: float, ref_min: float | None, ref_max: float | None) -> str:
    if ref_min is not None and value < ref_min:
        return "low"
    if ref_max is not None and value > ref_max:
        return "high"
    return "normal"


def _resolve_status(b: BiomarkerIn) -> str:
    # Референс — авторитетный источник; статус из запроса используется только без референса.
    if b.reference_min is not None or b.reference_max is not None:
        return compute_status(b.value, b.reference_min, b.reference_max)
    return b.status or "normal"


async def create_analysis(db: AsyncSession, user_id: int, data: HealthCreate) -> HealthAnalysis:
    analysis = HealthAnalysis(
        user_id=user_id,
        date=data.date,
        source=data.source,
        raw_data=encrypt(json.dumps(data.model_dump(mode="json"), ensure_ascii=False)),
    )
    for b in data.biomarkers:
        analysis.biomarkers.append(
            Biomarker(
                name=b.name,
                value=b.value,
                unit=b.unit,
                reference_min=b.reference_min,
                reference_max=b.reference_max,
                status=_resolve_status(b),
            )
        )
    db.add(analysis)
    await db.flush()
    await db.commit()
    return analysis


async def list_analyses(db: AsyncSession, user_id: int) -> list[HealthAnalysis]:
    stmt = (
        select(HealthAnalysis)
        .where(HealthAnalysis.user_id == user_id)
        .options(selectinload(HealthAnalysis.biomarkers))
        .order_by(HealthAnalysis.date.desc(), HealthAnalysis.id.desc())
    )
    return list(await db.scalars(stmt))


async def get_analysis(db: AsyncSession, user_id: int, analysis_id: int) -> HealthAnalysis | None:
    analysis = await db.scalar(
        select(HealthAnalysis)
        .where(HealthAnalysis.id == analysis_id)
        .options(selectinload(HealthAnalysis.biomarkers))
    )
    if analysis is None or analysis.user_id != user_id:
        return None
    return analysis


async def delete_analysis(db: AsyncSession, user_id: int, analysis_id: int) -> bool:
    analysis = await db.get(HealthAnalysis, analysis_id)
    if analysis is None or analysis.user_id != user_id:
        return False
    await db.delete(analysis)
    await db.commit()
    return True
