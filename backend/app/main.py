from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.sqlite import init_db
from app.api.routes.certification import router as certification_router
from app.core.config import settings
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database table structure on startup
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(certification_router, prefix="/api")
