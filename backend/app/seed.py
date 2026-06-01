"""Идемпотентный сидер каталога упражнений. Запуск: `python -m app.seed`."""
import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.exercise import ExerciseCatalog
from app.modules.exercises.catalog_data import CATALOG


async def seed_exercises() -> int:
    async with SessionLocal() as db:
        existing = set(
            await db.scalars(
                select(ExerciseCatalog.name).where(ExerciseCatalog.is_custom.is_(False))
            )
        )
        added = 0
        for name, category, groups in CATALOG:
            if name in existing:
                continue
            db.add(
                ExerciseCatalog(
                    name=name, category=category, muscle_groups=groups, is_custom=False
                )
            )
            added += 1
        await db.commit()
        return added


async def main() -> None:
    added = await seed_exercises()
    print(f"Seed complete: {added} exercises added.")


if __name__ == "__main__":
    asyncio.run(main())
