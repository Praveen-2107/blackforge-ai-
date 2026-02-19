# ⚔️ BlackForge AI - Adversarial ML Defense Platform

A production-ready full-stack platform for detecting, analyzing, and mitigating adversarial ML attacks including data poisoning and backdoor model attacks.

## 🚀 Quick Start

```bash
# Clone and navigate to the project
cd blackforge-AI

# Start the entire platform with Docker Compose
docker compose up
```

**Access the platform:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 🔥 Core Features

### 🔍 **Detection Engine**
- **Spectral Signatures**: Extract latent embeddings using frozen ResNet50/ViT, compute covariance singular vectors
- **Activation Clustering**: k-Means/DBSCAN clustering on embedding space to detect anomalous subclusters  
- **Influence Functions**: LiSSA approximation for Hessian-based influence to detect harmful training points

### 🛡️ **Mitigation Engine**
- **Data Purifier**: Remove poisoned clusters, rebuild clean datasets
- **Model Retraining**: Retrain models on purified datasets with before/after metrics

### 📊 **Benchmark & Audit**
- Clean accuracy, poisoned accuracy, recovered accuracy
- Backdoor success rate (BSR), data integrity score
- Threat grade (A-F scale), audit logs

## 🎯 User Workflow

### 1️⃣ Dataset Upload
- Upload CSV or image datasets
- Automatic metadata extraction and storage
- Redirect to analysis page

### 2️⃣ Dataset Poison Analysis
- **Automatic analysis** starts immediately after upload
- **Poison detection** using all 3 methods simultaneously
- **Poison type identification**: label flipping, outlier injection, feature noise, trigger patterns
- **Threat assessment**: confidence levels, accuracy impact estimation
- **Visualizations**: cluster maps, outlier heatmaps, threat distributions

### 3️⃣ Dataset Purification
- **One-click purification** removes detected poisoned samples
- **Real-time progress** tracking and status updates
- **Before/after comparisons** with accuracy metrics

### 4️⃣ Download Clean Dataset
- **Purified dataset download** ready for safe training
- **Integrity verification** and quality assurance
- **Audit trail** for compliance and tracking

## 🧠 ML Technology Stack

### Detection Algorithms
- **Spectral Signatures**: SVD-based covariance analysis
- **Activation Clustering**: Multi-algorithm clustering (k-means + DBSCAN)
- **Influence Functions**: LiSSA approximation for computational efficiency

### Supported Attack Types
- ✅ Label flipping attacks
- ✅ Outlier injection
- ✅ Feature noise poisoning  
- ✅ Trigger-pattern backdoors
- ✅ Gradient poisoning detection

## 🏗️ Technical Architecture

### Backend (FastAPI + PyTorch)
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/                 # REST API endpoints
│   │   ├── datasets.py      # Dataset upload/management
│   │   ├── detection.py     # Poison detection
│   │   ├── purification.py  # Dataset cleaning
│   │   └── audit.py         # Audit logs
│   ├── ml_engine/           # ML detection algorithms
│   │   ├── detection.py     # Core detection methods
│   │   ├── mitigation.py    # Purification algorithms
│   │   └── utils.py         # Utilities & visualization
│   └── db/                  # Database models
└── requirements.txt
```

### Frontend (React + Tailwind + Framer Motion)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.js           # Main dashboard
│   │   ├── DatasetUpload.js       # Upload interface
│   │   ├── DatasetAnalysis.js     # Analysis results
│   │   ├── PurificationResults.js # Purification summary
│   │   └── AuditLogs.js          # Audit history
│   ├── components/
│   │   ├── ThreatBadge.js        # Status indicators
│   │   ├── ClusterVisualization.js # 2D cluster plots
│   │   └── ResultsChart.js       # Metrics visualization
│   └── App.js                    # Main application
└── package.json
```

## 🎨 UI/UX Design

### Cybersecurity Theme
- **Color Palette**: Neon cyan (#00d9ff), electric purple (#c000ff), dark backgrounds
- **Glassmorphism**: Translucent panels with backdrop blur effects
- **Animations**: Smooth Framer Motion transitions and micro-interactions
- **Typography**: Monospace fonts for technical authenticity

### Status Indicators
- 🟢 **Safe** (0-30% confidence): Green badges, clean datasets
- 🟡 **Suspicious** (30-70% confidence): Yellow warnings, investigate further
- 🔴 **Poisoned** (70%+ confidence): Red alerts, immediate action required

## 🔧 API Endpoints

### Datasets
- `POST /api/datasets/upload` - Upload dataset for analysis
- `GET /api/datasets/list` - List all uploaded datasets

### Detection  
- `POST /api/detection/analyze_dataset` - Run poison detection analysis
- `POST /api/detection/detect_poison` - Legacy detection endpoint

### Purification
- `POST /api/purification/sanitize` - Clean dataset by removing poisoned samples
- `POST /api/purification/download/{id}` - Download purified dataset

### Audit
- `GET /api/audit/logs` - Retrieve audit trail
- `POST /api/audit/log_action` - Log security events

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:create_app --reload --factory

# Frontend  
cd frontend
npm install
npm start
```

### Production (Docker)
```bash
# Full platform deployment
docker compose up -d

# Scale services
docker compose up --scale celery-worker=3
```

### GPU Support
For GPU acceleration, modify `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## 📈 Performance & Scalability

### ML Performance
- **Detection Speed**: ~1-3 seconds for 10K samples
- **Memory Usage**: ~2-4GB for embedding extraction
- **GPU Acceleration**: Automatic CUDA detection and usage

### System Scalability
- **Celery Workers**: Horizontal scaling for ML workloads
- **Redis Cache**: Fast task queuing and results storage
- **PostgreSQL**: Robust metadata and audit storage

## 🔒 Security Features

### Data Integrity
- **File hashing**: SHA-256 verification for uploads
- **Input validation**: Type checking and sanitization
- **Audit trails**: Complete action logging

### Attack Simulation
- **Synthetic poisoning**: Generate test attacks for validation
- **Benchmark datasets**: CIFAR-10, MNIST, custom datasets
- **Threat modeling**: Real-world attack scenarios

## 🧪 Example Usage

### CSV Dataset Analysis
```python
# Upload CSV dataset
curl -X POST "http://localhost:8000/api/datasets/upload" \
     -F "file=@suspicious_dataset.csv"

# Automatic analysis starts
# View results at: http://localhost:3000/analysis/{dataset_id}
```

### Image Dataset Analysis  
```python
# Upload image folder (ZIP)
curl -X POST "http://localhost:8000/api/datasets/upload" \
     -F "file=@image_dataset.zip"

# Analysis includes ResNet50 embeddings + clustering
```

## 🎓 Research Background

### Academic Foundation
- **Spectral Signatures**: Based on Tran et al. (2018) "Spectral Signatures in Backdoor Attacks"
- **Influence Functions**: Koh & Liang (2017) "Understanding Black-box Predictions via Influence Functions"
- **Activation Clustering**: Chen et al. (2018) "Detecting Backdoor Attacks on Deep Neural Networks"

### Innovation
- **Real-time detection**: Sub-second analysis for production workflows
- **Multi-method ensemble**: Combines 3 orthogonal detection approaches
- **End-to-end purification**: Complete attack-to-recovery pipeline

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-detection`)
3. Commit changes (`git commit -m 'Add amazing detection method'`)
4. Push to branch (`git push origin feature/amazing-detection`)
5. Create Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Documentation**: [Full API docs](http://localhost:8000/docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/blackforge-ai/issues)
- **Research**: [Academic papers and references](docs/research.md)

---

**BlackForge AI** - Defending ML models against adversarial attacks, one dataset at a time. ⚔️🛡️