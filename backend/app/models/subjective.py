from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SubjectiveLog(Base):
    __tablename__ = "subjective_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "date", "slot", name="uq_subjective_user_date_slot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    slot: Mapped[str] = mapped_column(String(16))  # morning|evening

    # Утренние метрики (1–5)
    sleep_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    soreness: Mapped[int | None] = mapped_column(Integer, nullable=True)
    motivation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Вечерние метрики (1–5)
    stress: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fatigue: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfaction: Mapped[int | None] = mapped_column(Integer, nullable=True)

    body_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
