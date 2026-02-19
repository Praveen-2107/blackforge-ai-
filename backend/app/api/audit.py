from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import uuid
from datetime import datetime

from app.db import get_db
from app.db.models import AuditLog

logger = logging.getLogger(__name__)
router = APIRouter()


class AuditLogEntry(BaseModel):
    id: Optional[str] = None
    model_id: Optional[str] = None
    dataset_id: Optional[str] = None
    detection_method: str
    action: str
    threat_score: float
    threat_grade: str
    mitigation_applied: bool
    details: Dict[str, Any] = {}
    timestamp: Optional[str] = None


@router.get("/logs")
async def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve real audit logs from SQLite, newest first."""
    try:
        rows = (
            db.query(AuditLog)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )

        logs = [
            {
                "id":                 row.id,
                "dataset_id":         row.dataset_id,
                "model_id":           row.model_id,
                "detection_method":   row.detection_method,
                "action":             row.action,
                "threat_score":       row.threat_score,
                "threat_grade":       row.threat_grade,
                "mitigation_applied": row.mitigation_applied,
                "details":            row.details or {},
                # Always append Z so the frontend knows it's UTC
                "timestamp": (
                    row.timestamp.isoformat() + "Z"
                    if row.timestamp else None
                ),
            }
            for row in rows
        ]

        return {"logs": logs, "total": len(logs)}

    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/log_action")
async def log_action(entry: AuditLogEntry, db: Session = Depends(get_db)):
    """Write an audit log entry to SQLite."""
    try:
        record = AuditLog(
            id                 = entry.id or str(uuid.uuid4()),
            dataset_id         = entry.dataset_id,
            model_id           = entry.model_id,
            detection_method   = entry.detection_method,
            action             = entry.action,
            threat_score       = entry.threat_score,
            threat_grade       = entry.threat_grade,
            mitigation_applied = entry.mitigation_applied,
            details            = entry.details,
            timestamp          = datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        logger.info(f"Audit log saved: {record.action} / {record.dataset_id}")
        return {"success": True, "log_id": record.id}

    except Exception as e:
        logger.error(f"Failed to save audit log: {e}")
        raise HTTPException(status_code=500, detail=str(e))
