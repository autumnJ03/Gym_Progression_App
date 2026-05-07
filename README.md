# GymProg — Gym Progression Tracker

A full-stack web app for tracking gym workouts and progressive overload. Log your sets, track your weights over time, and let the app automatically progress your lifts.

**Live app:** [gymprog.vercel.app](https://gymprog.vercel.app)

---

## Features

- **Push/Pull/Legs program** — full 17-exercise PPL split (3×8)
- **Progressive overload engine** — automatically increases weight when you hit all reps, deloads when you miss
- **Workout logging** — log each set with weight and reps, track hit/miss per set
- **Progress charts** — bar or line chart showing your weight over time per exercise
- **Return detection** — if you haven't trained in 7+ days, the app offers a 10% deload to ease back in
- **JWT authentication** — register and log in securely

---

## Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| FastAPI | REST API framework |
| SQLAlchemy 2.0 (async) | ORM |
| asyncpg | PostgreSQL async driver |
| python-jose | JWT tokens |
| bcrypt | Password hashing |
| Pydantic v2 | Request/response validation |
| Uvicorn | ASGI server |

### Frontend
| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI |
| Vite | Build tool |
| Tailwind CSS v4 | Styling |
| TanStack Query | Server state / caching |
| Axios | HTTP client |
| React Router v6 | Navigation |
| Recharts | Progress charts |

### Infrastructure
| Service | Role |
|---------|------|
| Neon | Managed PostgreSQL |
| Render | Backend hosting |
| Vercel | Frontend hosting |

---

## Program — Push/Pull/Legs

All exercises are 3 sets × 8 reps.

**Push** — Chest · Shoulders · Triceps
- Bench Press (+5 lbs/session)
- Incline Press (+5 lbs/session)
- Shoulder Press (+2.5 lbs/session)
- Lateral Raise (+2.5 lbs/session)
- Tricep Extension (+2.5 lbs/session)
- Tricep Pushdown (+2.5 lbs/session)

**Pull** — Back · Biceps
- Lat Pulldown (+5 lbs/session)
- Seated Row (+5 lbs/session)
- Cable Row (+5 lbs/session)
- Dumbbell Curl (+2.5 lbs/session)
- Hammer Curl (+2.5 lbs/session)
- Face Pull (+2.5 lbs/session)

**Legs** — Quads · Hamstrings · Calves
- Squat (+5 lbs/session)
- Leg Press (+10 lbs/session)
- Leg Extension (+5 lbs/session)
- Leg Curl (+5 lbs/session)
- Calf Raise (+5 lbs/session)

---

## Progression Logic

- **Hit all reps** on every set → weight increases by the exercise increment next session
- **Miss any set** → weight stays the same (repeat)
- **Miss again** → weight drops by 10% (deload)
- **7+ days away** → app offers an optional 10% deload on return

---

## Running Locally

### Prerequisites
- Python 3.12
- Node.js 18+
- PostgreSQL 16 (via Homebrew: `brew install postgresql@16`)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://your_user@localhost:5432/gym_progression
JWT_SECRET=your-secret-key
JWT_EXPIRE_DAYS=30
```

```bash
# Create tables and seed the PPL program
python -m scripts.create_tables
python -m scripts.seed

# Start the API
uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. API calls are proxied to `localhost:8000`.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── auth/          # JWT + password hashing
│   │   ├── models/        # SQLAlchemy models
│   │   ├── repositories/  # DB access layer
│   │   ├── routers/       # API routes (auth, programs, me, workout)
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic (progression engine)
│   │   ├── config.py      # Environment variable settings
│   │   ├── database.py    # Async engine + session
│   │   └── main.py        # FastAPI app + CORS
│   ├── scripts/
│   │   ├── create_tables.py
│   │   └── seed.py        # PPL program seed (--reset to re-seed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios client + endpoint functions
│   │   ├── components/    # Layout, ProtectedRoute
│   │   ├── hooks/         # useAuth (JWT storage)
│   │   └── pages/         # Dashboard, Workout, Progress, Programs, Login, Register
│   ├── vercel.json        # API rewrite → Render backend
│   └── vite.config.ts     # Dev proxy + Tailwind plugin
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, get JWT |
| GET | `/api/v1/programs` | List programs |
| POST | `/api/v1/me/program` | Enroll in program |
| DELETE | `/api/v1/me/program` | Unenroll |
| GET | `/api/v1/me/today` | Today's session + exercises |
| GET | `/api/v1/me/status` | Return detection / idle days |
| POST | `/api/v1/me/workout` | Start a workout |
| POST | `/api/v1/me/workout/{id}/sets` | Log a set |
| POST | `/api/v1/me/workout/{id}/complete` | Complete workout + trigger progression |
| GET | `/api/v1/me/progress` | Weight history per exercise |

Full interactive docs available at `/docs` when running locally.
