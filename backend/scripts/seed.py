"""Seed the PPL program. Safe to re-run — skips if program already exists.
Usage: python -m scripts.seed
"""
import asyncio
from decimal import Decimal

from sqlalchemy import select

import app.models  # noqa: F401
from app.database import AsyncSessionLocal
from app.models.exercise import Exercise
from app.models.program import Program
from app.models.program_session import ProgramSession
from app.models.session_exercise import SessionExercise

EXERCISES = [
    {"name": "Bench Press", "muscle_group": "chest"},
    {"name": "Overhead Press", "muscle_group": "shoulders"},
    {"name": "Incline Bench Press", "muscle_group": "chest"},
    {"name": "Deadlift", "muscle_group": "back"},
    {"name": "Barbell Row", "muscle_group": "back"},
    {"name": "Pull-up", "muscle_group": "back"},
    {"name": "Squat", "muscle_group": "legs"},
    {"name": "Leg Press", "muscle_group": "legs"},
    {"name": "Leg Curl", "muscle_group": "legs"},
]

# (session_name, position, [(exercise_name, sets, reps, increment, order)])
SESSIONS = [
    (
        "Push",
        1,
        [
            ("Bench Press", 3, 5, Decimal("5.0"), 1),
            ("Overhead Press", 3, 5, Decimal("2.5"), 2),
            ("Incline Bench Press", 3, 8, Decimal("2.5"), 3),
        ],
    ),
    (
        "Pull",
        2,
        [
            ("Deadlift", 1, 5, Decimal("5.0"), 1),
            ("Barbell Row", 3, 5, Decimal("5.0"), 2),
            ("Pull-up", 3, 8, Decimal("2.5"), 3),
        ],
    ),
    (
        "Legs",
        3,
        [
            ("Squat", 3, 5, Decimal("5.0"), 1),
            ("Leg Press", 3, 10, Decimal("10.0"), 2),
            ("Leg Curl", 3, 10, Decimal("5.0"), 3),
        ],
    ),
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Program).where(Program.name == "Push/Pull/Legs"))
        if result.scalar_one_or_none():
            print("PPL program already exists — skipping.")
            return

        # Insert exercises
        exercise_map: dict[str, int] = {}
        for ex in EXERCISES:
            obj = Exercise(name=ex["name"], muscle_group=ex["muscle_group"])
            db.add(obj)
            await db.flush()
            exercise_map[ex["name"]] = obj.id

        # Insert program
        program = Program(
            name="Push/Pull/Legs",
            description="3-day PPL split. Linear progression: +increment every session you hit all reps.",
        )
        db.add(program)
        await db.flush()

        # Insert sessions and session_exercises
        for session_name, position, exercises in SESSIONS:
            session = ProgramSession(
                program_id=program.id, name=session_name, position=position
            )
            db.add(session)
            await db.flush()

            for ex_name, sets, reps, increment, order in exercises:
                se = SessionExercise(
                    session_id=session.id,
                    exercise_id=exercise_map[ex_name],
                    sets_prescribed=sets,
                    reps_prescribed=reps,
                    default_increment=increment,
                    order_in_session=order,
                )
                db.add(se)

        await db.commit()
        print(f"Seeded program '{program.name}' (id={program.id}) with {len(SESSIONS)} sessions.")


asyncio.run(main())
