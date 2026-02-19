from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import logging
from typing import List, Optional
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

# Path to the React build directory (populated in Docker)
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


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

    # ── Serve React frontend (single-service deployment) ──────
    if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
        # Mount static assets (JS, CSS, images) at /static
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR / "static")), name="react-static")

        # Serve root and catch-all for React Router (SPA)
        @app.get("/")
        async def serve_react_root():
            return FileResponse(str(STATIC_DIR / "index.html"))

        @app.get("/{full_path:path}")
        async def serve_react_app(full_path: str):
            # Try to serve the exact file first (e.g. favicon.ico, manifest.json)
            file_path = STATIC_DIR / full_path
            if file_path.is_file():
                return FileResponse(str(file_path))
            # Otherwise return index.html for React Router
            return FileResponse(str(STATIC_DIR / "index.html"))

        logger.info(f"Serving React frontend from {STATIC_DIR}")
    else:
        # No React build found — just show API info
        @app.get("/")
        async def root():
            return {"message": "BlackForge AI - Adversarial ML Defense Platform"}
        logger.info("No static build found, running API-only mode")

    return app


# Create app instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

