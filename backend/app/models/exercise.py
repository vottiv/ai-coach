from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ExerciseCatalog(Base):
    __tablename__ = "exercise_catalog"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str] = mapped_column(String(32), index=True)
    # Несколько мышечных групп на упражнение (ТЗ п. 7.1, п. 12)
    muscle_groups: Mapped[list] = mapped_column(JSONB, default=list)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
