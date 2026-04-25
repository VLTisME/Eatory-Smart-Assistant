import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")

database_url = os.getenv("DATABASE_URL")

print("DATABASE_URL:", database_url)

if not database_url:
    raise ValueError("Không tìm thấy DATABASE_URL trong file .env")

engine = create_engine(database_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Test query result:", result.scalar())

print("Database connection OK")