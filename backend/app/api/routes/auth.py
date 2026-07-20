"""
Authentification : inscription, connexion (JWT) et dépendance get_current_user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

from app.db.sqlite import get_db, User
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/auth")

# tokenUrl sert à la documentation Swagger ; le token est lu dans l'en-tête Authorization.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str


async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("10/minute")
async def register(request: Request, req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower()
    if await _get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet email.")
    user = User(email=email, password_hash=hash_password(req.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(request: Request, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await _get_user_by_email(db, req.email.lower())
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    return TokenResponse(access_token=create_access_token(user.email))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Jeton invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = decode_access_token(token)
    if not email:
        raise credentials_error
    user = await _get_user_by_email(db, email)
    if not user:
        raise credentials_error
    return user


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
