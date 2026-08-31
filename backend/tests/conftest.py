import os


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://gymflow_test:gymflow_test@localhost:5432/gymflow_test",
)
os.environ.setdefault(
    "JWT_SECRET",
    "gymflow-test-secret-not-for-production",
)
