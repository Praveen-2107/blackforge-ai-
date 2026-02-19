import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

function DatasetUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(null); }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first'); return; }
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const iv = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
      const res = await axios.post(`${API_BASE}/api/datasets/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(iv);
      setUploadProgress(100);
      setTimeout(() => {
        navigate(`/analysis/${res.data.dataset.id}`, {
          state: { filePath: res.data.dataset.file_path, datasetType: res.data.dataset.dataset_type }
        });
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Check backend connection.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  };

  const fileIcon = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    return ext === 'csv' ? '📊' : ext === 'zip' ? '📦' : ext === 'json' ? '📄' : '📁';
  };

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={fadeUp} className="page-header">
          <h1 className="page-title">Upload Dataset</h1>
          <p className="page-subtitle">Upload your ML dataset to run adversarial threat detection</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

          {/* Left: upload zone + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Drop zone */}
            <motion.div variants={fadeUp}>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onClick={() => document.getElementById('file-input').click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.zip,.tar.gz,.json,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  {file ? fileIcon(file.name) : dragOver ? '⬇' : '☁'}
                </div>
                <div className="upload-title">
                  {file
                    ? file.name
                    : dragOver
                      ? 'Drop to upload'
                      : 'Drop dataset here or click to browse'}
                </div>
                <div className="upload-sub">
                  {file
                    ? `${formatSize(file.size)} · Ready for analysis`
                    : 'CSV · ZIP · TAR.GZ · JSON · TXT · Max 100 MB'}
                </div>
                {file && (
                  <div style={{ marginTop: 12 }}>
                    <span className="badge badge-green">✓ FILE LOADED</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Progress */}
            <AnimatePresence>
              {uploading && (
                <motion.div
                  className="card card-p"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="mono">
                      {uploadProgress < 50 ? 'TRANSFERRING...' : uploadProgress < 90 ? 'VALIDATING...' : 'INITIALIZING...'}
                    </span>
                    <span className="mono text-cyan" style={{ fontSize: 12 }}>{uploadProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ type: 'spring', stiffness: 100 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="alert alert-error"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span>⚠</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Upload Error</div>
                    <div style={{ fontSize: 12 }}>{error}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <motion.div variants={fadeUp} className="flex gap-3">
              <motion.button
                className="btn btn-primary btn-lg flex-1"
                onClick={handleUpload}
                disabled={!file || uploading}
                whileHover={{ scale: file && !uploading ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
              >
                {uploading ? (
                  <><div className="spinner" />Uploading...</>
                ) : (
                  <><span className="btn-icon">🚀</span>Deploy Analysis Protocol</>
                )}
              </motion.button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                ← Back
              </button>
            </motion.div>

            {/* Security notice */}
            <motion.div variants={fadeUp} className="alert alert-warn">
              <span>🔒</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Security Protocol</div>
                <div style={{ fontSize: 12 }}>
                  All data is processed in isolated environments. Files are purged after analysis. No permanent storage.
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: pipeline + methods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Analysis pipeline */}
            <motion.div variants={fadeUp} className="card card-p">
              <div className="section-title mb-3">Analysis Pipeline</div>
              {[
                { n: '01', name: 'Format Validation', time: '~5s' },
                { n: '02', name: 'Spectral Signature Scan', time: '~30s' },
                { n: '03', name: 'Activation Clustering', time: '~45s' },
                { n: '04', name: 'Influence Function Mapping', time: '~60s' },
                { n: '05', name: 'Threat Classification', time: '~15s' },
              ].map(s => (
                <div key={s.n} className="pipeline-step">
                  <div className="step-num">{s.n}</div>
                  <div className="step-name">{s.name}</div>
                  <div className="step-time">{s.time}</div>
                </div>
              ))}
            </motion.div>

            {/* Detection methods */}
            <motion.div variants={fadeUp} className="card card-p">
              <div className="section-title mb-3">Detection Methods</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Spectral Signatures', acc: '94%', color: 'cyan', desc: 'Eigenvalue analysis' },
                  { name: 'Activation Clustering', acc: '91%', color: 'purple', desc: 'Neural pattern anomalies' },
                  { name: 'Influence Functions', acc: '88%', color: 'green', desc: 'Sample impact mapping' },
                ].map(m => (
                  <div key={m.name} className="method-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    <div className="flex items-center justify-between w-full">
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span className={`badge badge-${m.color}`}>{m.acc}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DatasetUpload;
