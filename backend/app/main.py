from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.db.sqlite import init_db
from app.api.routes.certification import router as certification_router
from app.api.routes.auth import router as auth_router
from app.api.routes.badges import router as badges_router
from app.core.config import settings
from app.core.rate_limit import limiter
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database table structure on startup
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Rate limiting : enregistre le limiteur et le handler renvoyant un 429.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(certification_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(badges_router, prefix="/api")
