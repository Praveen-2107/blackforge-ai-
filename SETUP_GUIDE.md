# BlackForge AI Development Setup

## Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Git

## Quick Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd blackforge-ai
   ```

2. **Generate test data**:
   ```bash
   python test_data_generator.py
   ```

3. **Start development environment**:
   ```bash
   # Option 1: Docker Compose (Recommended)
   docker compose up

   # Option 2: Manual setup
   # Terminal 1: Backend
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:create_app --reload --factory

   # Terminal 2: Frontend  
   cd frontend
   npm install
   npm start
   ```

4. **Access the platform**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Testing the Platform

1. **Upload test dataset**:
   - Go to http://localhost:3000/upload
   - Upload the generated `test_poisoned_dataset.csv`

2. **Analyze results**:
   - Analysis starts automatically
   - View detection results and visualizations
   - Check poison confidence and threat scores

3. **Purify dataset**:
   - Click "Purify Dataset" button
   - Review before/after metrics
   - Download clean dataset

## Development Tips

- Backend auto-reloads with `--reload` flag
- Frontend hot-reloads with `npm start`
- Use `docker compose logs -f backend` to view backend logs
- PostgreSQL admin: http://localhost:5432 (user: blackforge, password: blackforge_password)

## Architecture Validation

✅ **Detection Engine**: Implements real Spectral Signatures, Activation Clustering, Influence Functions
✅ **Mitigation**: Real data purification with accuracy metrics
✅ **Frontend**: Cybersecurity theme with glassmorphism and animations
✅ **API**: Complete REST endpoints for upload, detect, purify, audit
✅ **Docker**: Production-ready containerized deployment
✅ **Database**: PostgreSQL with proper models and relationships