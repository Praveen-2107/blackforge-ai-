import numpy as np
import torch
import torch.nn.functional as F
from sklearn.preprocessing import StandardScaler
from sklearn.covariance import EmpiricalCovariance
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from scipy import stats
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class SpectralSignatures:
    """Detect poisoning via covariance singular vectors (spectral signatures)"""

    def __init__(self, n_components: int = 50, threshold_percentile: float = 95):
        self.n_components = n_components
        self.threshold_percentile = threshold_percentile
        self.eigenvectors = None
        self.mean_embedding = None

    def detect(
        self, embeddings: np.ndarray, labels: np.ndarray = None
    ) -> Dict[str, Any]:
        """
        Detect poisoned samples using spectral signatures.

        Args:
            embeddings: (n_samples, embedding_dim) array
            labels: Optional ground truth labels

        Returns:
            Detection results with suspicious indices
        """
        embeddings = np.asarray(embeddings, dtype=np.float32)
        labels = np.asarray(labels, dtype=np.int32) if labels is not None else None

        # Center embeddings
        self.mean_embedding = embeddings.mean(axis=0)
        centered = embeddings - self.mean_embedding

        # Compute SVD
        U, S, Vt = np.linalg.svd(centered.T @ centered, full_matrices=False)

        # Get top singular vectors
        n_to_use = min(self.n_components, len(S))
        self.eigenvectors = U[:, :n_to_use]

        # Project onto spectral space
        spectral_projections = centered @ self.eigenvectors

        # Compute anomaly scores (L2 distance in spectral space)
        anomaly_scores = np.linalg.norm(spectral_projections, axis=1)

        # Threshold
        threshold = np.percentile(anomaly_scores, self.threshold_percentile)
        suspicious_mask = anomaly_scores > threshold

        suspicious_indices = np.where(suspicious_mask)[0].tolist()
        poison_confidence = min(len(suspicious_indices) / len(embeddings) * 100, 100.0)

        # Estimate accuracy impact
        accuracy_impact = poison_confidence * 0.5  # Conservative estimate

        return {
            "method": "spectral_signatures",
            "poison_detected": len(suspicious_indices) > 0,
            "poison_confidence": poison_confidence,
            "suspicious_indices": suspicious_indices,
            "anomaly_scores": anomaly_scores.tolist(),
            "threshold": float(threshold),
            "estimated_accuracy_impact": accuracy_impact,
        }


class ActivationClustering:
    """Detect poisoning via clustering on embedding space"""

    def __init__(self, n_clusters: int = 10, eps: float = 0.5, min_samples: int = 5):
        self.n_clusters = n_clusters
        self.eps = eps
        self.min_samples = min_samples

    def detect(
        self, embeddings: np.ndarray, labels: np.ndarray = None
    ) -> Dict[str, Any]:
        """
        Detect poisoned samples using activation clustering.

        Args:
            embeddings: (n_samples, embedding_dim) array
            labels: Optional ground truth labels

        Returns:
            Detection results with anomalous clusters
        """
        embeddings = np.asarray(embeddings, dtype=np.float32)
        labels = np.asarray(labels, dtype=np.int32) if labels is not None else None

        # K-Means clustering
        kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)

        # DBSCAN for density-based anomalies
        scaler = StandardScaler()
        scaled_embeddings = scaler.fit_transform(embeddings)
        dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        density_labels = dbscan.fit_predict(scaled_embeddings)

        # Find outliers and anomalous clusters
        suspicious_mask = (
            (density_labels == -1)  # DBSCAN outliers
            | (cluster_labels == self._find_anomalous_cluster(cluster_labels, labels))
        )

        suspicious_indices = np.where(suspicious_mask)[0].tolist()

        # Compute distances to cluster centers
        distances = np.min(
            np.linalg.norm(embeddings[:, None] - kmeans.cluster_centers_[None], axis=2),
            axis=1,
        )
        anomaly_scores = (distances - distances.min()) / (distances.max() - distances.min() + 1e-8)

        poison_confidence = min(len(suspicious_indices) / len(embeddings) * 100, 100.0)
        accuracy_impact = poison_confidence * 0.4

        return {
            "method": "activation_clustering",
            "poison_detected": len(suspicious_indices) > 0,
            "poison_confidence": poison_confidence,
            "suspicious_indices": suspicious_indices,
            "anomaly_scores": anomaly_scores.tolist(),
            "cluster_labels": cluster_labels.tolist(),
            "estimated_accuracy_impact": accuracy_impact,
            "n_outliers": int(np.sum(density_labels == -1)),
        }

    @staticmethod
    def _find_anomalous_cluster(cluster_labels: np.ndarray, true_labels: np.ndarray = None) -> int:
        """Find the cluster with most anomalous characteristics"""
        if true_labels is None:
            # Return cluster with smallest size (likely poisoned)
            unique, counts = np.unique(cluster_labels, return_counts=True)
            return unique[np.argmin(counts)]

        # Return cluster with highest label diversity (likely poisoned)
        max_diversity = 0
        anomalous_cluster = 0
        for cluster_id in np.unique(cluster_labels):
            mask = cluster_labels == cluster_id
            cluster_labels_diversity = len(np.unique(true_labels[mask]))
            if cluster_labels_diversity > max_diversity:
                max_diversity = cluster_labels_diversity
                anomalous_cluster = cluster_id
        return anomalous_cluster


class InfluenceFunctions:
    """Detect harmful training samples using LiSSA approximation"""

    def __init__(self, damping: float = 0.01, n_samples: int = 100):
        self.damping = damping
        self.n_samples = n_samples

    def detect(
        self,
        embeddings: np.ndarray,
        labels: np.ndarray,
        model_predictions: np.ndarray = None,
    ) -> Dict[str, Any]:
        """
        Detect poisoned samples using influence functions.

        Args:
            embeddings: (n_samples, embedding_dim) array
            labels: Ground truth labels (n_samples,)
            model_predictions: Optional model predictions

        Returns:
            Detection results with influence scores
        """
        embeddings = np.asarray(embeddings, dtype=np.float32)
        labels = np.asarray(labels, dtype=np.int32)

        # Generate pseudo-predictions if not provided
        if model_predictions is None:
            model_predictions = self._generate_pseudo_predictions(embeddings, labels)

        # Compute gradients (simplified: difference from prediction)
        gradients = (model_predictions - labels.reshape(-1, 1))

        # Approximate Hessian-vector product using LiSSA
        influence_scores = self._compute_influence_lissa(embeddings, gradients)

        # Threshold suspicious samples
        threshold = np.percentile(np.abs(influence_scores), 75)
        suspicious_mask = np.abs(influence_scores) > threshold

        suspicious_indices = np.where(suspicious_mask)[0].tolist()
        poison_confidence = min(len(suspicious_indices) / len(embeddings) * 100, 100.0)
        accuracy_impact = poison_confidence * 0.6

        return {
            "method": "influence_functions",
            "poison_detected": len(suspicious_indices) > 0,
            "poison_confidence": poison_confidence,
            "suspicious_indices": suspicious_indices,
            "influence_scores": influence_scores.tolist(),
            "threshold": float(threshold),
            "estimated_accuracy_impact": accuracy_impact,
        }

    @staticmethod
    def _generate_pseudo_predictions(embeddings: np.ndarray, labels: np.ndarray) -> np.ndarray:
        """Generate pseudo model predictions using simple classifier"""
        n_classes = len(np.unique(labels))
        predictions = np.zeros((len(embeddings), n_classes))

        for i in range(len(embeddings)):
            # Simple cosine similarity to class centroids
            for c in range(n_classes):
                mask = labels == c
                if np.sum(mask) > 0:
                    centroid = embeddings[mask].mean(axis=0)
                    similarity = np.dot(embeddings[i], centroid) / (
                        np.linalg.norm(embeddings[i]) * np.linalg.norm(centroid) + 1e-8
                    )
                    predictions[i, c] = similarity

        # Normalize to probabilities
        predictions = np.maximum(predictions, 0)
        predictions = predictions / (predictions.sum(axis=1, keepdims=True) + 1e-8)
        return predictions

    def _compute_influence_lissa(
        self, embeddings: np.ndarray, gradients: np.ndarray
    ) -> np.ndarray:
        """Approximate influence using LiSSA (Low-rank + Second-order approximation)"""
        n_samples = len(embeddings)

        # Simplified Hessian approximation (diagonal)
        hessian_diag = np.zeros(embeddings.shape[1])
        for i in range(min(self.n_samples, n_samples)):
            x = embeddings[i]
            grad = gradients[i]
            hessian_diag += (grad ** 2) * (x ** 2)

        hessian_diag /= min(self.n_samples, n_samples)
        hessian_diag += self.damping

        # Compute influence scores
        influence_scores = np.zeros(n_samples)
        for i in range(n_samples):
            grad = gradients[i]
            influence = np.sum((grad ** 2) / hessian_diag)
            influence_scores[i] = influence

        # Normalize
        influence_scores = (influence_scores - influence_scores.mean()) / (
            influence_scores.std() + 1e-8
        )
        return influence_scores


class PoisonTypeDetector:
    """Identify the type of poisoning attack"""

    @staticmethod
    def detect_poison_type(
        original_embeddings: np.ndarray,
        suspicious_indices: List[int],
        labels: np.ndarray = None,
        poison_confidence: float = 0.0,
    ) -> str:
        """
        Identify type of poison (label flip, outlier, feature noise, trigger).

        Args:
            original_embeddings: Original embedding space
            suspicious_indices: Indices of suspicious samples
            labels: Optional labels
            poison_confidence: Detection confidence

        Returns:
            Poison type string
        """
        if len(suspicious_indices) == 0:
            return "none"

        suspicious_embeddings = original_embeddings[suspicious_indices]
        clean_embeddings = np.delete(original_embeddings, suspicious_indices, axis=0)

        # 1. Check for statistical outliers (outlier injection)
        distances = np.linalg.norm(suspicious_embeddings - clean_embeddings.mean(axis=0), axis=1)
        if distances.mean() > clean_embeddings.std() * 2.5:
            return "outlier_injection"

        # 2. Check for label flipping (high label diversity in suspicious cluster)
        if labels is not None:
            label_diversity = len(np.unique(labels[suspicious_indices]))
            expected_diversity = len(np.unique(labels[len(suspicious_indices) :]))
            if label_diversity > expected_diversity * 1.5:
                return "label_flipping"

        # 3. Check for feature noise (high variance in specific dimensions)
        suspicious_variance = suspicious_embeddings.var(axis=0)
        clean_variance = clean_embeddings.var(axis=0)
        noise_ratio = (suspicious_variance / (clean_variance + 1e-8)).mean()
        if noise_ratio > 2.0:
            return "feature_noise_poisoning"

        # 4. Default to trigger pattern
        return "trigger_pattern_poisoning"
