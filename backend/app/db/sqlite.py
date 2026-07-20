from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from datetime import datetime, timezone

from app.core.config import settings


def _utcnow() -> datetime:
    """Horodatage UTC timezone-aware (remplace datetime.utcnow, déprécié)."""
    return datetime.now(timezone.utc)


engine = create_async_engine(settings.DATABASE_URL, future=True, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    exam_sessions = relationship("ExamSession", back_populates="user")

class ExamSession(Base):
    __tablename__ = 'exam_sessions'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=_utcnow, index=True)
    duration_seconds = Column(Integer)
    score = Column(Integer)
    transcript = Column(Text)
    status = Column(String)
    # Partie de l'épreuve concernée (soutenance, entretien-technique, questionnaire,
    # entretien-final, ou "examen-blanc" pour le bilan global). Null pour les anciennes lignes.
    exam_part = Column(String, nullable=True, index=True)
    # Propriétaire de la session (null pour les anciennes lignes anonymes).
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)

    user = relationship("User", back_populates="exam_sessions")
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
        # Micro-migrations : ajoute les colonnes récentes aux bases existantes.
        await conn.run_sync(_ensure_columns)


def _ensure_columns(conn):
    from sqlalchemy import text
    cols = conn.execute(text("PRAGMA table_info(exam_sessions)")).fetchall()
    names = {c[1] for c in cols}
    if "exam_part" not in names:
        conn.execute(text("ALTER TABLE exam_sessions ADD COLUMN exam_part VARCHAR"))
    if "user_id" not in names:
        conn.execute(text("ALTER TABLE exam_sessions ADD COLUMN user_id INTEGER"))

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
