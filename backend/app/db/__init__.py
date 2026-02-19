# Database initialization
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base

DATABASE_URL = "sqlite:///./blackforge.db"  # Change to PostgreSQL in production

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
