from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import uuid
import json
from pathlib import Path
from typing import List, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BlackForge AI",
    description="Adversarial ML Defense Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
UPLOAD_DIR = Path("uploads/datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Pydantic models
class DetectionRequest(BaseModel):
    dataset_id: str
    file_path: str
    dataset_type: str
    methods: List[str] = ["spectral", "activation", "influence"]

class PurificationRequest(BaseModel):
    dataset_id: str
    file_path: str
    dataset_type: str
    suspicious_indices: List[int]
    analysis_id: str

# Routes
@app.get("/")
async def root():
    return {"message": "BlackForge AI Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "BlackForge AI"}

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload dataset"""
    try:
        # Generate unique ID
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / file.filename
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Determine dataset type
        dataset_type = "csv" if file.filename.endswith(".csv") else "image"
        
        logger.info(f"Uploaded file: {file.filename} ({len(content)} bytes)")
        
        return {
            "success": True,
            "dataset": {
                "id": file_id,
                "name": file.filename,
                "file_path": str(file_path),
                "file_size": len(content),
                "dataset_type": dataset_type
            }
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detection/analyze_dataset")
async def analyze_dataset(request: DetectionRequest):
    """Analyze dataset for poisoning"""
    try:
        import random
        
        # Mock analysis results
        poison_confidence = random.uniform(25, 85)
        suspicious_count = random.randint(5, 50)
        suspicious_indices = list(range(suspicious_count))
        
        # Determine poison type based on confidence
        if poison_confidence > 70:
            poison_type = "label_flipping"
        elif poison_confidence > 50:
            poison_type = "trigger_pattern_poisoning"
        elif poison_confidence > 30:
            poison_type = "outlier_injection"
        else:
            poison_type = "none"
        
        # Calculate threat grade
        if poison_confidence > 80:
            threat_grade = "F"
        elif poison_confidence > 60:
            threat_grade = "D"
        elif poison_confidence > 40:
            threat_grade = "C"
        elif poison_confidence > 20:
            threat_grade = "B"
        else:
            threat_grade = "A"
        
        # Mock visualization data
        visualization = {
            "method": "pca",
            "points": [
                {
                    "x": random.uniform(-10, 10),
                    "y": random.uniform(-10, 10),
                    "cluster": random.randint(0, 3),
                    "suspicious": i < suspicious_count,
                    "index": i
                }
                for i in range(100)
            ],
            "bounds": {
                "x_min": -10,
                "x_max": 10,
                "y_min": -10,
                "y_max": 10
            }
        }
        
        results = {
            "spectral": {
                "poison_confidence": poison_confidence * 0.9,
                "suspicious_indices": suspicious_indices[:15],
                "estimated_accuracy_impact": poison_confidence * 0.4
            },
            "activation": {
                "poison_confidence": poison_confidence * 1.1,
                "suspicious_indices": suspicious_indices[:20],
                "estimated_accuracy_impact": poison_confidence * 0.5
            },
            "influence": {
                "poison_confidence": poison_confidence * 0.8,
                "suspicious_indices": suspicious_indices[:10],
                "estimated_accuracy_impact": poison_confidence * 0.6
            }
        }
        
        logger.info(f"Analysis complete for {request.dataset_id}: {poison_confidence:.1f}% confidence")
        
        return {
            "analysis_id": request.dataset_id,
            "poison_detected": poison_confidence > 30,
            "poison_confidence": round(poison_confidence, 2),
            "poison_type": poison_type,
            "estimated_accuracy_impact": round(poison_confidence * 0.5, 2),
            "suspicious_sample_count": suspicious_count,
            "suspicious_indices": suspicious_indices,
            "threat_score": round(poison_confidence, 2),
            "threat_grade": threat_grade,
            "results": results,
            "visualization": visualization
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/purification/sanitize")
async def sanitize_dataset(request: PurificationRequest):
    """Sanitize dataset by removing poisoned samples"""
    try:
        import random
        
        # Mock purification results
        num_removed = len(request.suspicious_indices)
        clean_path = request.file_path.replace(".", "_purified.")
        
        accuracy_before = random.uniform(75, 85)
        accuracy_after = random.uniform(87, 96)
        integrity_score = random.uniform(85, 98)
        
        logger.info(f"Purification complete: removed {num_removed} samples")
        
        return {
            "purification_id": request.analysis_id,
            "clean_dataset_path": clean_path,
            "poisoned_samples_removed": num_removed,
            "data_integrity_score": round(integrity_score, 2),
            "accuracy_before": round(accuracy_before, 2),
            "accuracy_after": round(accuracy_after, 2)
        }
        
    except Exception as e:
        logger.error(f"Purification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit/logs")
async def get_audit_logs():
    """Get audit logs"""
    logs = [
        {
            "id": "log_001",
            "dataset_id": "dataset_001",
            "detection_method": "spectral",
            "action": "detect",
            "threat_score": 75.5,
            "threat_grade": "C",
            "mitigation_applied": True,
            "details": {"poison_type": "label_flip"},
            "timestamp": "2024-01-27T10:30:00Z"
        }
    ]
    return {"logs": logs, "total": len(logs)}

if __name__ == "__main__":
    print("Starting BlackForge AI Backend...")
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="info")