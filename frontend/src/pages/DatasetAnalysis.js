import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE from '../config';
import ThreatBadge from '../components/ThreatBadge';
import ClusterVisualization from '../components/ClusterVisualization';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

/* ─────────────────────────────────────────────────────────────
   Dataset Picker — shown when user lands on /analysis directly
   without coming from the upload flow
───────────────────────────────────────────────────────────── */
function DatasetPicker() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/datasets/list`);
        setDatasets(res.data.datasets || []);
      } catch {
        setError('Could not load datasets. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAnalyze = () => {
    if (!selected) return;
    // Navigate to /analysis/:id with the file info in state
    navigate(`/analysis/${selected.id || encodeURIComponent(selected.name)}`, {
      state: {
        filePath: selected.file_path,
        datasetType: selected.name.endsWith('.csv') ? 'csv' : 'image',
        datasetName: selected.name,
      }
    });
  };

  const formatSize = (b) => {
    if (!b) return '—';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  };

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={fadeUp} className="page-header">
          <h1 className="page-title">Detection Engine</h1>
          <p className="page-subtitle">
            Select an uploaded dataset to run adversarial threat analysis
          </p>
        </motion.div>

        {/* Flow breadcrumb */}
        <motion.div variants={fadeUp} className="card card-p mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {[
              { step: '01', label: 'Upload Dataset', path: '/upload', done: true },
              { step: '02', label: 'Detection Engine', path: '/analysis', done: false, active: true },
              { step: '03', label: 'Purify Dataset', path: null, done: false },
              { step: '04', label: 'Download Results', path: null, done: false },
            ].map((s, i, arr) => (
              <React.Fragment key={s.step}>
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: s.path ? 'pointer' : 'default', flex: 1,
                  }}
                  onClick={() => s.path && navigate(s.path)}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                    fontFamily: 'JetBrains Mono',
                    background: s.active
                      ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
                      : s.done ? 'rgba(0,217,255,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${s.active ? 'var(--cyan)' : s.done ? 'rgba(0,217,255,0.3)' : 'var(--border)'}`,
                    color: s.active ? '#000' : s.done ? 'var(--cyan)' : 'var(--text-muted)',
                  }}>
                    {s.done ? '✓' : s.step}
                  </div>
                  <span style={{
                    fontSize: 11, textAlign: 'center',
                    color: s.active ? 'var(--cyan)' : s.done ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontWeight: s.active ? 700 : 400,
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, background: s.done ? 'rgba(0,217,255,0.3)' : 'var(--border)',
                    marginBottom: 20,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Dataset list */}
        <motion.div variants={fadeUp} className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="section-title">Uploaded Datasets</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/upload')}>
                + Upload New
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading datasets...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 24 }}>
              <div className="alert alert-error">
                <span>⚠</span>
                <div>
                  <div style={{ fontWeight: 700 }}>Connection Error</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
                </div>
              </div>
            </div>
          ) : datasets.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No datasets uploaded yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                Upload a dataset first to run detection analysis
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                <span>↑</span> Upload Dataset
              </button>
            </div>
          ) : (
            <div>
              {datasets.map((ds, i) => (
                <motion.div
                  key={ds.file_path || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(ds)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected?.file_path === ds.file_path
                      ? 'rgba(0,217,255,0.06)'
                      : 'transparent',
                    borderLeft: selected?.file_path === ds.file_path
                      ? '3px solid var(--cyan)'
                      : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}>
                    {ds.name?.endsWith('.csv') ? '📊' : ds.name?.endsWith('.zip') ? '📦' : '📁'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}
                      className="mono">{ds.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatSize(ds.file_size)}
                      {ds.uploaded_at && ` · Uploaded ${new Date(
                        ds.uploaded_at.endsWith('Z') ? ds.uploaded_at : ds.uploaded_at + 'Z'
                      ).toLocaleString()}`}
                    </div>
                  </div>
                  {selected?.file_path === ds.file_path && (
                    <span className="badge badge-cyan">✓ Selected</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Analyze button */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 16, display: 'flex', gap: 12 }}
            >
              <motion.button
                className="btn btn-primary btn-lg"
                onClick={handleAnalyze}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="btn-icon">◎</span>
                Analyze: {selected.name}
              </motion.button>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Detection / Analysis Results page
───────────────────────────────────────────────────────────── */
function DatasetAnalysis() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purifying, setPurifying] = useState(false);
  const [error, setError] = useState(null);

  const performAnalysis = useCallback(async (filePath, datasetType) => {
    try {
      const res = await axios.post(`${API_BASE}/api/detection/analyze_dataset`, {
        dataset_id: datasetId || 'unknown',
        file_path: filePath,
        dataset_type: datasetType,
        methods: ['spectral', 'activation', 'influence'],
      });
      setAnalysis(res.data);
    } catch (err) {
      setError('Analysis failed. The backend may be unavailable.');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    const filePath = location.state?.filePath;
    const datasetType = location.state?.datasetType || 'csv';
    if (filePath) {
      performAnalysis(filePath, datasetType);
    } else {
      // No state = came from sidebar directly, show picker
      setLoading(false);
    }
  }, [location, performAnalysis]);

  // No file info in state → show dataset picker
  if (!loading && !analysis && !error && !location.state?.filePath) {
    return <DatasetPicker />;
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Analyzing: <span className="mono text-cyan">{location.state?.datasetName || datasetId}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }} className="mono">
            Running spectral · clustering · influence analysis
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="alert alert-error">
          <span>⚠</span>
          <div>
            <div style={{ fontWeight: 700 }}>Analysis Failed</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{error}</div>
          </div>
        </div>
        <div className="flex gap-3" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => navigate('/analysis')}>
            ← Pick Another Dataset
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
            Upload New Dataset
          </button>
        </div>
      </div>
    );
  }

  const threatColor = analysis.threat_score > 60 ? 'red' : analysis.threat_score > 30 ? 'amber' : 'green';

  const handlePurify = async () => {
    if (!analysis) return;
    setPurifying(true);
    try {
      const res = await axios.post(`${API_BASE}/api/purification/sanitize`, {
        dataset_id: datasetId || 'unknown',
        file_path: location.state?.filePath || '',
        dataset_type: location.state?.datasetType || 'csv',
        suspicious_indices: analysis.suspicious_indices,
        analysis_id: analysis.analysis_id,
      });
      navigate(`/purification/${res.data.purification_id}`, {
        state: { purificationData: res.data }
      });
    } catch (err) {
      setError('Purification request failed.');
    } finally {
      setPurifying(false);
    }
  };

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={fadeUp} className="page-header">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-title">Detection Results</h1>
            <ThreatBadge level="high" confidence={analysis.poison_confidence} />
          </div>
          <p className="page-subtitle">
            {location.state?.datasetName
              ? <><span className="mono text-cyan">{location.state.datasetName}</span> · </>
              : null}
            Threat Score: <span className={`mono text-${threatColor}`}>{analysis.threat_score.toFixed(1)}/100</span>
          </p>
        </motion.div>

        {/* Stat row */}
        <motion.div variants={fadeUp} className="grid-4 mb-6">
          {[
            { label: 'Poison Confidence', value: `${analysis.poison_confidence.toFixed(1)}%`, color: 'red' },
            { label: 'Suspicious Samples', value: analysis.suspicious_sample_count, color: 'amber' },
            { label: 'Accuracy Impact', value: `-${analysis.estimated_accuracy_impact.toFixed(1)}%`, color: 'red' },
            { label: 'Poison Type', value: analysis.poison_type.replace(/_/g, ' ').toUpperCase(), color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="card card-p stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value text-${s.color}`} style={{ fontSize: s.label === 'Poison Type' ? 14 : 28 }}>
                {s.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Analysis results */}
          <motion.div variants={fadeUp} className="card card-p-lg">
            <div className="section-title mb-4">Analysis Results</div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Poison Confidence</span>
                <span className="mono text-red" style={{ fontSize: 13, fontWeight: 700 }}>
                  {analysis.poison_confidence.toFixed(1)}%
                </span>
              </div>
              <div className="progress-track">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.poison_confidence}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ background: 'linear-gradient(90deg, #ef4444, #b91c1c)' }}
                />
              </div>
            </div>
            <div className="divider" />
            {[
              { label: 'Poison Type', value: analysis.poison_type.replace(/_/g, ' ').toUpperCase(), color: 'cyan' },
              { label: 'Suspicious Samples', value: `${analysis.suspicious_sample_count} detected`, color: 'amber' },
              { label: 'Accuracy Impact', value: `-${analysis.estimated_accuracy_impact.toFixed(1)}%`, color: 'red' },
            ].map(r => (
              <div key={r.label} className="compare-row">
                <span className="compare-label">{r.label}</span>
                <span className={`compare-value text-${r.color}`}>{r.value}</span>
              </div>
            ))}
            <div className="divider" />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This dataset contains {analysis.poison_type.replace(/_/g, ' ')} affecting model
              accuracy by approximately {analysis.estimated_accuracy_impact.toFixed(1)}%.
            </p>
          </motion.div>

          {/* Cluster map */}
          <motion.div variants={fadeUp} className="card card-p-lg">
            <div className="section-title mb-4">Cluster Visualization</div>
            <ClusterVisualization data={analysis.visualization} />
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔴 Suspicious samples</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔵 Clean samples</span>
            </div>
          </motion.div>
        </div>

        {/* Detection methods breakdown */}
        <motion.div variants={fadeUp} className="card card-p-lg mb-6">
          <div className="section-title mb-4">Detection Methods Breakdown</div>
          <div className="grid-3">
            {Object.entries(analysis.results).map(([method, result]) => (
              <div key={method} className="method-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div className="flex items-center justify-between w-full">
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                    {method}
                  </span>
                  <span className="badge badge-cyan">{result.poison_confidence.toFixed(1)}%</span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.poison_confidence}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {result.suspicious_indices.length} detections
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex gap-3">
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handlePurify}
            disabled={purifying}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {purifying
              ? <><div className="spinner" />Purifying...</>
              : <><span className="btn-icon">🛡️</span>Purify Dataset</>
            }
          </motion.button>
          <button className="btn btn-secondary" onClick={() => navigate('/analysis')}>
            ← Pick Another Dataset
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Dashboard
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default DatasetAnalysis;
