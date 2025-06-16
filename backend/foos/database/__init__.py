import os
from sqlmodel import SQLModel, create_engine
from dotenv import load_dotenv


load_dotenv()

DB_URL = os.getenv("DB_URL")
if not DB_URL:
    raise ValueError("Missing DB url")

engine = create_engine(DB_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
