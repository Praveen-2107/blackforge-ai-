from fastapi import APIRouter, File, UploadFile, HTTPException
import torch
import os
import logging
from pathlib import Path
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

MODEL_UPLOAD_DIR = Path("uploads/models")
MODEL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_model(file: UploadFile = File(...)):
    """Upload a pretrained PyTorch model"""
    try:
        model_id = str(uuid.uuid4())
        file_path = MODEL_UPLOAD_DIR / file.filename

        MODEL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Verify it's a valid PyTorch model
        try:
            _ = torch.load(file_path, map_location="cpu")
        except Exception as e:
            file_path.unlink()
            raise HTTPException(status_code=400, detail=f"Invalid PyTorch model: {e}")

        metadata = {
            "id": model_id,
            "name": file.filename,
            "file_size": len(content),
            "file_path": str(file_path),
        }

        logger.info(f"Model uploaded: {model_id} - {file.filename}")

        return {"success": True, "model": metadata}

    except Exception as e:
        logger.error(f"Model upload failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list")
async def list_models():
    """List all uploaded models"""
    models = []

    if MODEL_UPLOAD_DIR.exists():
        for file_path in MODEL_UPLOAD_DIR.iterdir():
            if file_path.is_file():
                models.append(
                    {
                        "name": file_path.name,
                        "file_size": file_path.stat().st_size,
                        "file_path": str(file_path),
                    }
                )

    return {"models": models}
