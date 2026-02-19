import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import logging
import hashlib

logger = logging.getLogger(__name__)


def compute_file_hash(file_path: str, algorithm: str = "sha256") -> str:
    """Compute file hash for integrity checking"""
    hash_obj = hashlib.new(algorithm)
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


def get_embedding_model(model_type: str = "resnet50", device: str = "cpu") -> nn.Module:
    """Load pretrained embedding model"""
    if model_type == "resnet50":
        model = models.resnet50(pretrained=True)
        model.fc = nn.Identity()  # Remove classification head
    elif model_type == "vit":
        model = models.vision_transformer.vit_b_16(pretrained=True)
        # Use last hidden state
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    model = model.to(device)
    model.eval()
    return model


class DatasetProcessor:
    """Process different dataset types into embeddings"""

    @staticmethod
    def process_csv_dataset(
        file_path: str, embedding_model=None, device: str = "cpu"
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Process CSV dataset.

        Returns:
            (embeddings, labels) - Both numpy arrays
        """
        df = pd.read_csv(file_path)

        # Assume last column is label
        if df.shape[1] < 2:
            raise ValueError("CSV must have at least 2 columns (features + label)")

        labels = df.iloc[:, -1].values
        features = df.iloc[:, :-1].values.astype(np.float32)

        # Normalize features
        features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)

        # Use features as embeddings directly
        embeddings = features

        logger.info(f"Processed CSV: {embeddings.shape[0]} samples, {embeddings.shape[1]} features")

        return embeddings, labels

    @staticmethod
    def process_image_dataset(
        dataset_path: str,
        embedding_model=None,
        device: str = "cpu",
        img_size: Tuple[int, int] = (224, 224),
    ) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Process image dataset (folder structure: dataset/class/image.jpg).

        Returns:
            (embeddings, labels, image_paths)
        """
        if embedding_model is None:
            embedding_model = get_embedding_model("resnet50", device)

        dataset_path = Path(dataset_path)
        embeddings_list = []
        labels_list = []
        image_paths_list = []

        # Image preprocessing
        transform = transforms.Compose(
            [
                transforms.Resize(img_size),
                transforms.CenterCrop(img_size),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        )

        class_to_label = {}
        label_counter = 0

        # Iterate through classes
        for class_dir in sorted(dataset_path.iterdir()):
            if not class_dir.is_dir():
                continue

            if class_dir.name not in class_to_label:
                class_to_label[class_dir.name] = label_counter
                label_counter += 1

            label = class_to_label[class_dir.name]

            # Iterate through images
            for img_path in sorted(class_dir.iterdir()):
                if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                    continue

                try:
                    # Load and preprocess image
                    img = Image.open(img_path).convert("RGB")
                    img_tensor = transform(img).unsqueeze(0).to(device)

                    # Extract embedding
                    with torch.no_grad():
                        embedding = embedding_model(img_tensor).cpu().numpy().flatten()

                    embeddings_list.append(embedding)
                    labels_list.append(label)
                    image_paths_list.append(str(img_path))

                except Exception as e:
                    logger.warning(f"Failed to process image {img_path}: {e}")
                    continue

        embeddings = np.array(embeddings_list, dtype=np.float32)
        labels = np.array(labels_list, dtype=np.int32)

        logger.info(f"Processed image dataset: {embeddings.shape[0]} images")

        return embeddings, labels, image_paths_list

    @staticmethod
    def process_pytorch_model(
        model_path: str, device: str = "cpu"
    ) -> Tuple[nn.Module, Dict[str, Any]]:
        """Load PyTorch model and extract metadata"""
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        try:
            model = torch.load(model_path, map_location=device)
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

        # Count parameters
        total_params = sum(p.numel() for p in model.parameters())
        trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

        metadata = {
            "total_parameters": int(total_params),
            "trainable_parameters": int(trainable_params),
            "device": device,
            "dtype": str(model.dtype),
        }

        return model, metadata


class VisualizationDataGenerator:
    """Generate visualization data for frontend"""

    @staticmethod
    def generate_cluster_visualization(
        embeddings: np.ndarray,
        cluster_labels: np.ndarray,
        suspicious_indices: List[int] = None,
        method: str = "pca",
    ) -> Dict[str, Any]:
        """Generate 2D/3D visualization data"""
        from sklearn.decomposition import PCA
        from sklearn.manifold import TSNE

        # Dimensionality reduction
        if method == "pca":
            reducer = PCA(n_components=2, random_state=42)
        elif method == "tsne":
            reducer = TSNE(n_components=2, random_state=42)
        else:
            reducer = PCA(n_components=2, random_state=42)

        reduced = reducer.fit_transform(embeddings)

        points = []
        for i, (x, y) in enumerate(reduced):
            is_suspicious = i in (suspicious_indices or [])
            points.append(
                {
                    "x": float(x),
                    "y": float(y),
                    "cluster": int(cluster_labels[i]) if cluster_labels is not None else 0,
                    "suspicious": is_suspicious,
                    "index": i,
                }
            )

        return {
            "method": method,
            "points": points,
            "bounds": {
                "x_min": float(reduced[:, 0].min()),
                "x_max": float(reduced[:, 0].max()),
                "y_min": float(reduced[:, 1].min()),
                "y_max": float(reduced[:, 1].max()),
            },
        }

    @staticmethod
    def generate_heatmap_data(
        anomaly_scores: np.ndarray,
        suspicious_indices: List[int] = None,
    ) -> Dict[str, Any]:
        """Generate heatmap data for anomalies"""
        bins = 50
        hist, bin_edges = np.histogram(anomaly_scores, bins=bins)

        heatmap_data = [
            {
                "bin": int(i),
                "count": int(hist[i]),
                "range": f"{bin_edges[i]:.3f}-{bin_edges[i+1]:.3f}",
                "is_suspicious_range": bin_edges[i] >= np.percentile(anomaly_scores, 75),
            }
            for i in range(len(hist))
        ]

        return {
            "heatmap": heatmap_data,
            "total_samples": len(anomaly_scores),
            "suspicious_count": len(suspicious_indices) if suspicious_indices else 0,
        }

    @staticmethod
    def generate_threat_distribution(
        poison_confidences: List[float],
        threat_scores: List[float],
    ) -> Dict[str, Any]:
        """Generate threat distribution visualization"""
        return {
            "confidence_distribution": {
                "min": float(min(poison_confidences)) if poison_confidences else 0,
                "max": float(max(poison_confidences)) if poison_confidences else 100,
                "mean": float(np.mean(poison_confidences)) if poison_confidences else 0,
                "median": float(np.median(poison_confidences)) if poison_confidences else 0,
            },
            "threat_distribution": {
                "min": float(min(threat_scores)) if threat_scores else 0,
                "max": float(max(threat_scores)) if threat_scores else 100,
                "mean": float(np.mean(threat_scores)) if threat_scores else 0,
                "median": float(np.median(threat_scores)) if threat_scores else 0,
            },
        }
