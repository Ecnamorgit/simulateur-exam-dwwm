"""
Badges de compétences (relation N:N users <-> badges).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from typing import List

from app.db.sqlite import get_db, Badge, User, user_badges
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/badges")


class BadgeSchema(BaseModel):
    id: int
    code: str
    label: str
    description: str | None = None
    model_config = ConfigDict(from_attributes=True)


async def award_badge(db: AsyncSession, user_id: int, code: str) -> bool:
    """Attribue un badge à un utilisateur (idempotent). Retourne True si nouvellement attribué."""
    badge = (await db.execute(select(Badge).where(Badge.code == code))).scalar_one_or_none()
    if not badge:
        return False
    already = (await db.execute(
        select(user_badges).where(
            user_badges.c.user_id == user_id,
            user_badges.c.badge_id == badge.id,
        )
    )).first()
    if already:
        return False
    await db.execute(insert(user_badges).values(user_id=user_id, badge_id=badge.id))
    await db.commit()
    return True


@router.get("", response_model=List[BadgeSchema])
async def list_badges(db: AsyncSession = Depends(get_db)):
    """Tous les badges disponibles."""
    return (await db.execute(select(Badge).order_by(Badge.id))).scalars().all()


@router.get("/me", response_model=List[BadgeSchema])
async def my_badges(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Badges obtenus par l'utilisateur connecté."""
    stmt = (
        select(Badge)
        .join(user_badges, Badge.id == user_badges.c.badge_id)
        .where(user_badges.c.user_id == current_user.id)
        .order_by(Badge.id)
    )
    return (await db.execute(stmt)).scalars().all()


@router.post("/me/{code}", response_model=List[BadgeSchema])
async def award_to_me(code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Attribue le badge `code` à l'utilisateur connecté puis renvoie ses badges."""
    badge = (await db.execute(select(Badge).where(Badge.code == code))).scalar_one_or_none()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge inconnu.")
    await award_badge(db, current_user.id, code)
    return await my_badges(db, current_user)
