from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
from pathlib import Path

app = FastAPI(title="BlackForge AI", description="Adversarial ML Defense Platform")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories
UPLOAD_DIR = Path("uploads/datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "BlackForge AI backend is running!", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "BlackForge AI"}

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset"""
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / file.filename
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {
        "success": True,
        "dataset": {
            "id": file_id,
            "name": file.filename,
            "file_path": str(file_path),
            "file_size": len(content),
            "dataset_type": "csv" if file.filename.endswith(".csv") else "image"
        }
    }

@app.post("/api/detection/analyze_dataset")
async def analyze_dataset(request: dict):
    """Mock analysis endpoint"""
    import random
    
    poison_confidence = random.uniform(30, 85)
    suspicious_count = int(random.uniform(10, 50))
    
    return {
        "analysis_id": request.get("dataset_id"),
        "poison_detected": poison_confidence > 40,
        "poison_confidence": poison_confidence,
        "poison_type": "label_flipping",
        "estimated_accuracy_impact": poison_confidence * 0.6,
        "suspicious_sample_count": suspicious_count,
        "suspicious_indices": list(range(suspicious_count)),
        "threat_score": poison_confidence,
        "threat_grade": "C",
        "results": {"spectral": {"poison_confidence": poison_confidence, "suspicious_indices": list(range(10))}},
        "visualization": {
            "method": "pca",
            "points": [{"x": i, "y": i*0.5, "cluster": 0, "suspicious": i < 20, "index": i} for i in range(100)],
            "bounds": {"x_min": 0, "x_max": 100, "y_min": 0, "y_max": 50}
        }
    }

@app.post("/api/purification/sanitize")
async def sanitize_dataset(request: dict):
    """Mock purification endpoint"""
    import random
    
    return {
        "purification_id": request.get("analysis_id"),
        "clean_dataset_path": request.get("file_path", "").replace(".", "_purified."),
        "poisoned_samples_removed": len(request.get("suspicious_indices", [])),
        "data_integrity_score": random.uniform(85, 98),
        "accuracy_before": random.uniform(75, 85),
        "accuracy_after": random.uniform(88, 96)
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting BlackForge AI backend...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")