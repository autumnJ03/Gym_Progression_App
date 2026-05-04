"""Seed the PPL program.
Usage:
  python -m scripts.seed          # skip if program already exists
  python -m scripts.seed --reset  # wipe all data and re-seed
"""
import asyncio
import sys
from decimal import Decimal

from sqlalchemy import text

import app.models  # noqa: F401
from app.database import AsyncSessionLocal
from app.models.exercise import Exercise
from app.models.program import Program
from app.models.program_session import ProgramSession
from app.models.session_exercise import SessionExercise

# ── Program definition ────────────────────────────────────────────────────────

EXERCISES = [
    {"name": "Bench Press",       "muscle_group": "chest"},
    {"name": "Incline Press",     "muscle_group": "chest"},
    {"name": "Shoulder Press",    "muscle_group": "shoulders"},
    {"name": "Lateral Raise",     "muscle_group": "shoulders"},
    {"name": "Tricep Extension",  "muscle_group": "triceps"},
    {"name": "Tricep Pushdown",   "muscle_group": "triceps"},
    {"name": "Lat Pulldown",      "muscle_group": "back"},
    {"name": "Seated Row",        "muscle_group": "back"},
    {"name": "Cable Row",         "muscle_group": "back"},
    {"name": "Dumbbell Curl",     "muscle_group": "biceps"},
    {"name": "Hammer Curl",       "muscle_group": "biceps"},
    {"name": "Face Pull",         "muscle_group": "shoulders"},
    {"name": "Squat",             "muscle_group": "legs"},
    {"name": "Leg Press",         "muscle_group": "legs"},
    {"name": "Leg Extension",     "muscle_group": "legs"},
    {"name": "Leg Curl",          "muscle_group": "legs"},
    {"name": "Calf Raise",        "muscle_group": "legs"},
]

# (session_name, position, [(exercise_name, sets, reps, increment_lbs, order)])
SESSIONS = [
    (
        "Push",  # Chest · Shoulders · Triceps
        1,
        [
            ("Bench Press",      3, 8, Decimal("5.0"),  1),
            ("Incline Press",    3, 8, Decimal("5.0"),  2),
            ("Shoulder Press",   3, 8, Decimal("2.5"),  3),
            ("Lateral Raise",    3, 8, Decimal("2.5"),  4),
            ("Tricep Extension", 3, 8, Decimal("2.5"),  5),
            ("Tricep Pushdown",  3, 8, Decimal("2.5"),  6),
        ],
    ),
    (
        "Pull",  # Back · Biceps
        2,
        [
            ("Lat Pulldown",  3, 8, Decimal("5.0"), 1),
            ("Seated Row",    3, 8, Decimal("5.0"), 2),
            ("Cable Row",     3, 8, Decimal("5.0"), 3),
            ("Dumbbell Curl", 3, 8, Decimal("2.5"), 4),
            ("Hammer Curl",   3, 8, Decimal("2.5"), 5),
            ("Face Pull",     3, 8, Decimal("2.5"), 6),
        ],
    ),
    (
        "Legs",  # Quads · Hamstrings · Calves
        3,
        [
            ("Squat",         3, 8, Decimal("5.0"),  1),
            ("Leg Press",     3, 8, Decimal("10.0"), 2),
            ("Leg Extension", 3, 8, Decimal("5.0"),  3),
            ("Leg Curl",      3, 8, Decimal("5.0"),  4),
            ("Calf Raise",    3, 8, Decimal("5.0"),  5),
        ],
    ),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

async def wipe(db) -> None:
    """Delete all data in dependency order."""
    for tbl in (
        "set_logs",
        "user_exercise_states",
        "workout_logs",
        "user_programs",
        "session_exercises",
        "sessions",
        "programs",
        "exercises",
    ):
        await db.execute(text(f"DELETE FROM {tbl}"))
    await db.commit()
    print("All data wiped.")


async def seed(db) -> None:
    exercise_map: dict[str, int] = {}
    for ex in EXERCISES:
        obj = Exercise(name=ex["name"], muscle_group=ex["muscle_group"])
        db.add(obj)
        await db.flush()
        exercise_map[ex["name"]] = obj.id

    program = Program(
        name="Push/Pull/Legs",
        description=(
            "Classic 3-day PPL split targeting push muscles (chest/shoulders/triceps), "
            "pull muscles (back/biceps), and legs (quads/hamstrings/glutes). "
            "Linear progression: add weight every session you hit all reps."
        ),
    )
    db.add(program)
    await db.flush()

    for session_name, position, exercises in SESSIONS:
        session = ProgramSession(
            program_id=program.id, name=session_name, position=position
        )
        db.add(session)
        await db.flush()

        for ex_name, sets, reps, increment, order in exercises:
            db.add(SessionExercise(
                session_id=session.id,
                exercise_id=exercise_map[ex_name],
                sets_prescribed=sets,
                reps_prescribed=reps,
                default_increment=increment,
                order_in_session=order,
            ))

    await db.commit()
    print(f"Seeded '{program.name}' — {len(SESSIONS)} sessions, "
          f"{sum(len(s[2]) for s in SESSIONS)} exercises total.")


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    reset = "--reset" in sys.argv
    async with AsyncSessionLocal() as db:
        if reset:
            await wipe(db)
        else:
            from sqlalchemy import select
            if (await db.execute(select(Program).where(Program.name == "Push/Pull/Legs"))).scalar_one_or_none():
                print("PPL program already exists — run with --reset to replace it.")
                return
        await seed(db)


asyncio.run(main())
