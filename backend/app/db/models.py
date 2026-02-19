from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import configure_mappers
from datetime import datetime
import uuid

Base = declarative_base()


class Dataset(Base):
    __tablename__ = "datasets"
    
    model_config = {"protected_namespaces": ()}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    dataset_type = Column(String, nullable=False)  # csv, image, pytorch
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    tags = Column(JSON, default=[])
    info_metadata = Column(JSON, default={})


class Model(Base):
    __tablename__ = "models"
    
    model_config = {"protected_namespaces": ()}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    architecture = Column(String, nullable=True)
    tags = Column(JSON, default=[])
    info_metadata = Column(JSON, default={})


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, nullable=False)
    model_id = Column(String, nullable=True)
    detection_method = Column(String, nullable=False)  # spectral, activation, influence
    poison_detected = Column(Boolean, default=False)
    poison_confidence = Column(Float, default=0.0)
    poison_type = Column(String, nullable=True)  # label_flip, outlier, feature_noise, trigger
    estimated_accuracy_impact = Column(Float, default=0.0)
    suspicious_sample_count = Column(Integer, default=0)
    suspicious_sample_indices = Column(JSON, default=[])
    threat_score = Column(Float, default=0.0)
    threat_grade = Column(String, default="A")
    visualization_data = Column(JSON, default={})
    results_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)


class PurificationResult(Base):
    __tablename__ = "purification_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, nullable=False)
    dataset_id = Column(String, nullable=False)
    clean_dataset_path = Column(String, nullable=False)
    poisoned_samples_removed = Column(Integer, default=0)
    accuracy_before = Column(Float, default=0.0)
    accuracy_after = Column(Float, default=0.0)
    data_integrity_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=True)
    dataset_id = Column(String, nullable=True)
    detection_method = Column(String, nullable=False)
    action = Column(String, nullable=False)  # detect, purify, benchmark
    threat_score = Column(Float, default=0.0)
    threat_grade = Column(String, default="A")
    mitigation_applied = Column(Boolean, default=False)
    details = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)
