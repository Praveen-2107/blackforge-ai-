from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import logging
from typing import List, Optional
import asyncio

logger = logging.getLogger(__name__)


def create_app():
    """Create FastAPI application"""
    app = FastAPI(
        title="BlackForge AI",
        description="Adversarial ML Defense Platform",
        version="1.0.0",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Initialize database
    try:
        from app.db import init_db
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "BlackForge AI"}

    @app.get("/")
    async def root():
        return {"message": "BlackForge AI - Adversarial ML Defense Platform"}

    # Include routers with error handling
    try:
        from app.api import datasets, models, detection, purification, audit, ai

        app.include_router(datasets.router,     prefix="/api/datasets",     tags=["Datasets"])
        app.include_router(models.router,       prefix="/api/models",       tags=["Models"])
        app.include_router(detection.router,    prefix="/api/detection",    tags=["Detection"])
        app.include_router(purification.router, prefix="/api/purification", tags=["Purification"])
        app.include_router(audit.router,        prefix="/api/audit",        tags=["Audit"])
        app.include_router(ai.router,           prefix="/api/ai",           tags=["AI Assistant"])
        logger.info("All routers loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load all routers: {e}")
        # Create minimal routes for testing
        @app.get("/api/test")
        async def test_endpoint():
            return {"message": "Backend is working"}

    return app


# Create app instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
