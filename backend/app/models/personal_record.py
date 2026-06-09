from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class PersonalRecord(Base):
    __tablename__ = "personal_records"
    __table_args__ = (
        UniqueConstraint("user_id", "exercise_id", "type", name="uq_pr_user_exercise_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exercise_id: Mapped[int | None] = mapped_column(
        ForeignKey("exercise_catalog.id", ondelete="CASCADE"), nullable=True, index=True
    )
    exercise_name: Mapped[str] = mapped_column(String(160))
    type: Mapped[str] = mapped_column(String(16))  # max_weight|max_reps|max_volume
    value: Mapped[float] = mapped_column(Float)
    achieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Новые поля для детальной информации
    set_id: Mapped[int] = mapped_column(ForeignKey("exercise_sets.id", ondelete="SET NULL"), nullable=True)
    workout_id: Mapped[int] = mapped_column(ForeignKey("workouts.id", ondelete="CASCADE"), nullable=True)
    reps_at_max_weight: Mapped[int] = mapped_column(Integer, default=0)
    exercise_key: Mapped[str] = mapped_column(String(160))
