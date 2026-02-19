#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Simple FastAPI app to get started
app = FastAPI(title="BlackForge AI", description="Adversarial ML Defense Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "BlackForge AI"}

@app.get("/")
async def root():
    return {"message": "BlackForge AI Backend is running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)