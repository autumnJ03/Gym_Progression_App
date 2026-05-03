# Gym Progression App — Design Document

## Overview

A web app for tracking gym workouts against pre-built progressive overload programs. The centerpiece is a deterministic progression engine: log your sets, and the app automatically calculates what weight to use next session.

**Stack:** FastAPI (Python) · Neon Postgres · React/TypeScript  
**Hosting:** Render (API, free tier) · Vercel (frontend) · Neon (DB, free tier)  
**Observability:** Sentry (error tracking) · stdout structured logs

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Pre-built program templates (PPL, 5/3/1, etc.). No user-created programs in v1. |
| FR2 | App shows today's session. Tracks position in program, not calendar — skip a day and the missed session is still next up. |
| FR3 | Per-set logging. Hit/miss is binary: `reps_completed >= reps_prescribed`. |
| FR4 | Progression engine: hit all sets → add increment; miss → repeat weight; miss twice consecutively → deload that exercise 10%. |
| FR5 | Per-exercise increments from program template defaults (e.g. 2.5kg upper body, 5kg lower body). |
| FR6 | >30 days idle → "Welcome back, reduce by 10%?" prompt. User can override. |
| FR7 | Email/password auth. JWT tokens. User data fully isolated. |

**Out of scope (v1):** supersets, RPE, exercise swaps, custom programs, social features, native mobile, offline mode, push notifications.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR1 | Single instance, ~10 users. No caching, queues, or replicas. |
| NFR2 | Session render (today's workout + weights) under 500ms p95. Render free-tier cold start latency is acceptable. |
| NFR3 | Hand-rolled JWT + bcrypt. No OAuth in v1. |
| NFR4 | Neon Postgres. Trust platform backups. No custom backup strategy. |
| NFR5 | Sentry for error tracking. Stdout-only structured logs. |
| NFR6 | Render (API), Neon (DB), Vercel (frontend static). All free tier. |

---

## Data Model

### `users`
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| email | text unique | |
| password_hash | text | bcrypt |
| created_at | timestamptz | |

### `programs` — seeded templates
| column | type |
|--------|------|
| id | serial PK |
| name | text |
| description | text |

### `sessions` — template sessions within a program (e.g. Push A, Pull A, Legs A)
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| program_id | FK → programs | |
| name | text | |
| position | int | order in the cycle |

### `exercises`
| column | type |
|--------|------|
| id | serial PK |
| name | text |
| muscle_group | text |

### `session_exercises` — exercises within a template session
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| session_id | FK → sessions | |
| exercise_id | FK → exercises | |
| sets_prescribed | int | |
| reps_prescribed | int | |
| default_increment | numeric | e.g. 2.5 upper, 5 lower |
| order_in_session | int | |

### `user_programs` — user's enrollment
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| user_id | FK → users | |
| program_id | FK → programs | |
| next_session_position | int | which session comes next |
| started_at | timestamptz | |
| is_active | bool | one active program per user |

### `workout_logs` — a completed or in-progress session
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| user_program_id | FK → user_programs | |
| session_id | FK → sessions | |
| started_at | timestamptz | |
| completed_at | timestamptz | null if in-progress |

### `set_logs` — per-set logging
| column | type | notes |
|--------|------|-------|
| id | serial PK | |
| workout_log_id | FK → workout_logs | |
| session_exercise_id | FK → session_exercises | |
| set_number | int | |
| weight_used | numeric | |
| reps_completed | int | |
| hit | bool | reps_completed >= reps_prescribed |

### `user_exercise_state` — progression engine state
| column | type | notes |
|--------|------|-------|
| user_program_id | FK → user_programs | composite PK |
| exercise_id | FK → exercises | composite PK |
| current_weight | numeric | weight used next session |
| consecutive_misses | int | 0, 1, or 2 — deload triggers at 2 |

**Notes:**
- `user_exercise_state` is a dedicated state table, not derived from `set_logs` history.
- 30-day idle check is derived: `SELECT MAX(completed_at) FROM workout_logs WHERE user_program_id = ?`
- `next_session_position` advances on workout completion. Skipping a day leaves it unchanged.

---

## API Design

All routes prefixed `/api/v1`.

### Auth
```
POST /auth/register
POST /auth/login              → JWT
```

### Programs
```
GET  /programs                list available templates
GET  /programs/{id}           template detail + sessions + exercises
```

### User Program
```
POST   /me/program            enroll in a program
GET    /me/program            current enrollment + next session position
DELETE /me/program            unenroll
```

### Today's Session
```
GET  /me/session/today        next session with exercises, prescribed sets/reps, current weights
POST /me/session/today/start  creates workout_log, returns workout_log_id
```

### Logging
```
POST /me/workout/{workout_log_id}/sets      log a set
POST /me/workout/{workout_log_id}/complete  finish session → run progression engine → advance position
```

### Idle / Return
```
GET  /me/status                      days_idle, whether 30-day prompt should show
POST /me/accept-return-reduction     user confirms 10% welcome-back deload
```

**Notes:**
- No workout history endpoint in v1.
- Progression engine runs inside `POST .../complete`, after all sets are submitted.
- `/me/session/today` is the critical read path — must stay under 500ms.

---

## Architecture

### Deployment
```
Browser
  └── React/TS (Vercel — static)
        └── HTTPS → FastAPI (Render — free tier)
                    ├── asyncpg → Neon Postgres
                    └── Sentry
```

### Backend layers
```
routers/        HTTP — request parsing, auth middleware, response shaping
services/       Business logic — progression engine, idle check
repositories/   All DB queries — no SQL outside this layer
models/         SQLAlchemy table definitions
schemas/        Pydantic request/response shapes
auth/           JWT encode/decode, bcrypt hashing
```

Request flow: `router → service → repository → DB`

### Progression engine

Lives in `services/progression.py` as pure functions — no DB calls, no side effects. The service layer calls it after session completion, then persists the result via repository.

```python
def compute_next_state(
    current_weight: Decimal,
    consecutive_misses: int,
    all_sets_hit: bool,
    increment: Decimal,
) -> ExerciseState:
    ...
```

### Auth flow
```
POST /auth/login → bcrypt verify → sign JWT (user_id, exp) → return token
All /me/* routes → JWT middleware extracts user_id → passed to service layer
```

No refresh tokens in v1.

**Notes:**
- No ORM lazy loading. All queries are explicit in repositories to avoid N+1 on session render.
- No background jobs or task queue. Everything is synchronous request/response.

---

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Progression engine | All state transitions | Pure unit tests, no DB |
| Repositories | SQL correctness | Integration tests, real Postgres |
| API routes | Request/response contracts | FastAPI `TestClient` + test DB |
| Frontend | Not in v1 | — |

### Progression engine unit tests
Covers every branch:
- Hit all sets → weight increases by increment
- Miss once → same weight, `consecutive_misses` = 1
- Miss twice → deload 10%, `consecutive_misses` resets to 0
- `reps_completed == reps_prescribed` counts as a hit
- First session (no prior state)

### Integration tests
Test DB via Neon branch or local Postgres. Covers:
- Register + login flow
- Enroll → session renders correctly
- Log sets → complete session → state updates in DB
- 30-day idle detection query

### API tests (FastAPI `TestClient`)
Critical path end-to-end:
```
register → login → enroll → GET today's session → log sets → complete → GET today's session (verify weight advanced)
```

**No mocking the database.** Integration tests hit real Postgres. The progression engine is the only layer that gets pure unit tests.
