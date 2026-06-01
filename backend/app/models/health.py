from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class HealthAnalysis(Base):
    __tablename__ = "health_analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    source: Mapped[str | None] = mapped_column(String(160), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Шифруется на уровне приложения (ТЗ п. 3): хранит зашифрованный токен.
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    biomarkers: Mapped[list["Biomarker"]] = relationship(
        back_populates="analysis",
        cascade="all, delete-orphan",
        order_by="Biomarker.id",
        lazy="selectin",
    )


class Biomarker(Base):
    __tablename__ = "biomarkers"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("health_analyses.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(160))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reference_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    reference_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(8), default="normal")  # normal|high|low

    analysis: Mapped["HealthAnalysis"] = relationship(back_populates="biomarkers")
