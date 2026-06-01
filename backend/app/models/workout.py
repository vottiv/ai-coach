from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[date] = mapped_column(Date, index=True)
    type: Mapped[str] = mapped_column(String(16))  # strength|cardio|stretch|hiit|mixed
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feeling: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1..5
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    exercises: Mapped[list["WorkoutExercise"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.order",
        lazy="selectin",
    )


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int | None] = mapped_column(
        ForeignKey("exercise_catalog.id", ondelete="SET NULL"), nullable=True, index=True
    )
    exercise_name: Mapped[str] = mapped_column(String(160))
    order: Mapped[int] = mapped_column(Integer, default=0)

    workout: Mapped["Workout"] = relationship(back_populates="exercises")
    sets: Mapped[list["ExerciseSet"]] = relationship(
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseSet.order",
        lazy="selectin",
    )


class ExerciseSet(Base):
    __tablename__ = "exercise_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    workout_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("workout_exercises.id", ondelete="CASCADE"), index=True
    )
    weight: Mapped[float] = mapped_column(Float, default=0)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    rpe: Mapped[float | None] = mapped_column(Float, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    workout_exercise: Mapped["WorkoutExercise"] = relationship(back_populates="sets")
