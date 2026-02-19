import numpy as np
import pandas as pd
import torch
import os
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any

logger = logging.getLogger(__name__)


class DataPurifier:
    """Remove poisoned samples and rebuild clean dataset"""

    @staticmethod
    def purify_dataset(
        dataset_path: str,
        suspicious_indices: List[int],
        dataset_type: str = "csv",
    ) -> Tuple[str, int, float]:
        """
        Remove poisoned samples from dataset.

        Args:
            dataset_path: Path to original dataset
            suspicious_indices: Indices of poisoned samples
            dataset_type: Type of dataset (csv, image, etc.)

        Returns:
            (clean_dataset_path, num_removed, data_integrity_score)
        """
        suspicious_set = set(suspicious_indices)

        if dataset_type == "csv":
            return DataPurifier._purify_csv(dataset_path, suspicious_set)
        elif dataset_type == "image":
            return DataPurifier._purify_image_dataset(dataset_path, suspicious_set)
        else:
            raise ValueError(f"Unsupported dataset type: {dataset_type}")

    @staticmethod
    def _purify_csv(dataset_path: str, suspicious_set: set) -> Tuple[str, int, float]:
        """Purify CSV dataset"""
        df = pd.read_csv(dataset_path)
        original_size = len(df)

        # Keep only clean samples
        clean_indices = [i for i in range(len(df)) if i not in suspicious_set]
        clean_df = df.iloc[clean_indices].reset_index(drop=True)

        num_removed = original_size - len(clean_df)
        data_integrity_score = max(0.0, 100.0 * (1.0 - num_removed / original_size))

        # Save clean dataset
        output_path = dataset_path.replace(".csv", "_purified.csv")
        clean_df.to_csv(output_path, index=False)

        logger.info(
            f"Purified CSV: Removed {num_removed} samples, "
            f"integrity score: {data_integrity_score:.2f}%"
        )

        return output_path, num_removed, data_integrity_score

    @staticmethod
    def _purify_image_dataset(dataset_path: str, suspicious_set: set) -> Tuple[str, int, float]:
        """Purify image dataset (assumes folder structure)"""
        from shutil import copytree, ignore_patterns
        import os

        base_path = Path(dataset_path)
        output_path = base_path.parent / f"{base_path.name}_purified"

        if output_path.exists():
            import shutil

            shutil.rmtree(output_path)

        output_path.mkdir(parents=True, exist_ok=True)

        num_removed = 0
        total_files = 0

        for class_dir in base_path.iterdir():
            if not class_dir.is_dir():
                continue

            class_output = output_path / class_dir.name
            class_output.mkdir(parents=True, exist_ok=True)

            file_index = 0
            for file_path in sorted(class_dir.iterdir()):
                if file_path.is_file():
                    total_files += 1
                    if file_index not in suspicious_set:
                        import shutil

                        shutil.copy2(file_path, class_output / file_path.name)
                    else:
                        num_removed += 1
                    file_index += 1

        data_integrity_score = max(0.0, 100.0 * (1.0 - num_removed / max(total_files, 1)))

        logger.info(
            f"Purified image dataset: Removed {num_removed} images, "
            f"integrity score: {data_integrity_score:.2f}%"
        )

        return str(output_path), num_removed, data_integrity_score


class ModelRetrainer:
    """Retrain model on purified dataset and benchmark improvements"""

    @staticmethod
    def benchmark_accuracy(
        model: torch.nn.Module,
        data_loader,
        device: str = "cpu",
    ) -> float:
        """Compute model accuracy on dataset"""
        model.eval()
        correct = 0
        total = 0

        with torch.no_grad():
            for batch in data_loader:
                if isinstance(batch, (list, tuple)):
                    images, labels = batch[0].to(device), batch[1].to(device)
                else:
                    images = batch.to(device)
                    labels = None

                outputs = model(images)

                if labels is not None:
                    if outputs.dim() > 1:
                        predictions = outputs.argmax(dim=1)
                    else:
                        predictions = (outputs > 0.5).long()

                    correct += (predictions == labels).sum().item()
                    total += labels.size(0)

        accuracy = (correct / max(total, 1)) * 100.0
        return accuracy

    @staticmethod
    def compute_metrics_comparison(
        original_accuracy: float, cleaned_accuracy: float, num_removed: int
    ) -> Dict[str, Any]:
        """Compute before/after metrics"""
        improvement = cleaned_accuracy - original_accuracy
        removal_ratio = num_removed  # This will be percentage in real usage

        return {
            "accuracy_before": original_accuracy,
            "accuracy_after": cleaned_accuracy,
            "accuracy_improvement": improvement,
            "accuracy_improvement_percentage": (improvement / max(original_accuracy, 1)) * 100,
            "poisoned_samples_removed": num_removed,
            "recovery_status": "successful" if improvement > 0 else "unchanged",
        }
