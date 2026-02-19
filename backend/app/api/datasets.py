from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import os
import logging
from pathlib import Path
import uuid
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

def compute_file_hash(file_path: str, algorithm: str = "sha256") -> str:
    """Compute file hash for integrity checking"""
    hash_obj = hashlib.new(algorithm)
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()

UPLOAD_DIR = Path("uploads/datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class DatasetMetadata(BaseModel):
    id: str
    name: str
    dataset_type: str
    file_size: int
    file_hash: str
    uploaded_at: str
    tags: list = []


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    tags: str = "",
):
    """Upload a dataset (CSV or image folder)"""
    try:
        # Save file
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / file.filename

        # Create category directory
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # Save uploaded file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Compute metadata
        file_hash = compute_file_hash(str(file_path))
        file_size = len(content)

        # Determine dataset type
        if file.filename.endswith(".csv"):
            dataset_type = "csv"
        elif file.filename.endswith((".zip", ".tar.gz")):
            dataset_type = "image"
        else:
            dataset_type = "unknown"

        metadata = {
            "id": file_id,
            "name": file.filename,
            "dataset_type": dataset_type,
            "file_size": file_size,
            "file_hash": file_hash,
            "file_path": str(file_path),
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
        }

        logger.info(f"Dataset uploaded: {file_id} - {file.filename}")

        return {
            "success": True,
            "dataset": metadata,
            "message": f"Dataset uploaded successfully",
        }

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list")
async def list_datasets():
    """List all uploaded datasets"""
    datasets = []

    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file():
                file_hash = compute_file_hash(str(file_path))
                datasets.append(
                    {
                        "name": file_path.name,
                        "file_size": file_path.stat().st_size,
                        "file_hash": file_hash,
                        "file_path": str(file_path),
                        "uploaded_at": str(file_path.stat().st_mtime),
                    }
                )

    return {"datasets": datasets}


@router.get("/{dataset_id}")
async def get_dataset_info(dataset_id: str):
    """Get dataset metadata"""
    # This would typically query the database
    return {"id": dataset_id, "message": "Dataset info endpoint"}
