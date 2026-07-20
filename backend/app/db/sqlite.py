from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from datetime import datetime, timezone

from app.core.config import settings


def _utcnow() -> datetime:
    """Horodatage UTC timezone-aware (remplace datetime.utcnow, déprécié)."""
    return datetime.now(timezone.utc)


engine = create_async_engine(settings.DATABASE_URL, future=True, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

class ExamSession(Base):
    __tablename__ = 'exam_sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=_utcnow, index=True)
    duration_seconds = Column(Integer)
    score = Column(Integer)
    transcript = Column(Text)
    status = Column(String)

    criteria_results = relationship("CriteriaResult", back_populates="exam_session", cascade="all, delete-orphan")
    generated_questions = relationship("GeneratedQuestion", back_populates="exam_session", cascade="all, delete-orphan")

class CriteriaResult(Base):
    __tablename__ = 'criteria_results'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('exam_sessions.id'), index=True)
    name = Column(String)
    checked = Column(Boolean)
    feedback = Column(Text)
    
    exam_session = relationship("ExamSession", back_populates="criteria_results")

class GeneratedQuestion(Base):
    __tablename__ = 'generated_questions'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('exam_sessions.id'), index=True)
    type = Column(String)  # "qcm" or "jury"
    question_text = Column(Text)
    choices = Column(Text)  # JSON-serialized list of strings for QCM, or empty/null for jury
    correct_answer = Column(String)  # The string matching the correct choice or keyword
    explanation = Column(Text)

    exam_session = relationship("ExamSession", back_populates="generated_questions")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
