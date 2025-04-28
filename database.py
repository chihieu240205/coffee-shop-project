from dotenv import load_dotenv
load_dotenv()

import os
from sqlmodel import SQLModel, create_engine, Session

# load the DATABASE_URL from your .env (you’ll set that up next)
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Provide a transactional session to path into your path operations."""
    with Session(engine) as session:
        yield session
