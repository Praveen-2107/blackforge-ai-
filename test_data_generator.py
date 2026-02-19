# Example test dataset (poisoned CSV)
import pandas as pd
import numpy as np

# Generate a sample dataset with some poisoned samples
np.random.seed(42)

# Clean samples
clean_samples = 900
features = 10

# Generate clean data
clean_data = np.random.normal(0, 1, (clean_samples, features))
clean_labels = np.random.randint(0, 3, clean_samples)

# Generate poisoned samples (outliers)
poisoned_samples = 100
poisoned_data = np.random.normal(5, 2, (poisoned_samples, features))  # Different distribution
poisoned_labels = np.random.randint(0, 3, poisoned_samples)

# Combine clean and poisoned data
all_data = np.vstack([clean_data, poisoned_data])
all_labels = np.hstack([clean_labels, poisoned_labels])

# Create DataFrame
df = pd.DataFrame(all_data, columns=[f'feature_{i}' for i in range(features)])
df['label'] = all_labels

# Save test dataset
df.to_csv('test_poisoned_dataset.csv', index=False)
print(f"Generated test dataset with {len(df)} samples ({poisoned_samples} poisoned)")