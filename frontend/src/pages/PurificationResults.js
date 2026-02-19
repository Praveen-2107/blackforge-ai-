import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import API_BASE from '../config';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

function PurificationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { purificationId } = useParams();

  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const d = location.state?.purificationData;
    if (d) setData(d);
  }, [location]);

  /* ── Download handler ── */
  const handleDownload = async () => {
    const id = data?.purification_id || purificationId;
    if (!id) {
      setDownloadError('No purification ID found. Please run purification first.');
      return;
    }

    setDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/purification/download/${id}`);

      if (!response.ok) {
        let detail = `Server error (${response.status})`;
        try { detail = (await response.json()).detail || detail; } catch (_) { }
        throw new Error(detail);
      }

      // Pull filename from Content-Disposition header if present
      const cd = response.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename[^;=\n]*=["']?([^"'\n]+)["']?/);
      const filename = match ? match[1] : 'purified_dataset.csv';

      // Create a blob URL and click a hidden <a> to trigger the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      // Auto-clear success banner after 4 s
      setTimeout(() => setDownloadSuccess(false), 4000);

    } catch (err) {
      setDownloadError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Empty state ── */
  if (!data) {
    return (
      <div className="page-content">
        <div className="alert alert-info">
          <span>ℹ</span>
          <div>
            <div style={{ fontWeight: 700 }}>No Purification Data</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Please run a detection analysis first, then click "Purify Dataset".
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/upload')}>
          ← Upload Dataset
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'Before', accuracy: data.accuracy_before },
    { name: 'After', accuracy: data.accuracy_after },
  ];
  const improvement = (data.accuracy_after - data.accuracy_before).toFixed(2);

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* ── Page header ── */}
        <motion.div variants={fadeUp} className="page-header">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-title">Purification Complete</h1>
            <span className="badge badge-green">✓ SUCCESS</span>
          </div>
          <p className="page-subtitle">
            Dataset has been cleaned and is ready for model training
          </p>
        </motion.div>

        {/* ── Key metrics ── */}
        <motion.div variants={fadeUp} className="grid-3 mb-6">
          {[
            { label: 'Poisoned Samples Removed', value: data.poisoned_samples_removed, suffix: ' samples', color: 'red' },
            { label: 'Data Integrity Score', value: data.data_integrity_score.toFixed(1), suffix: '%', color: 'green' },
            { label: 'Accuracy Recovery', value: `+${improvement}`, suffix: '%', color: 'cyan' },
          ].map((m, i) => (
            <motion.div key={i} className="card card-p stat-card" variants={fadeUp} whileHover={{ y: -2 }}>
              <div className="stat-label">{m.label}</div>
              <div className={`stat-value text-${m.color}`}>{m.value}{m.suffix}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Accuracy bar chart */}
          <motion.div variants={fadeUp} className="card card-p-lg">
            <div className="section-title mb-4">Accuracy Before vs After</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,217,255,0.08)" />
                <XAxis dataKey="name" stroke="var(--text-muted)"
                  tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-md)',
                    borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono',
                  }}
                  cursor={{ fill: 'rgba(0,217,255,0.05)' }}
                />
                <Bar dataKey="accuracy" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Detailed comparison */}
          <motion.div variants={fadeUp} className="card card-p-lg">
            <div className="section-title mb-4">Detailed Comparison</div>
            {[
              { label: 'Accuracy Before', value: `${data.accuracy_before.toFixed(2)}%`, color: 'red' },
              { label: 'Accuracy After', value: `${data.accuracy_after.toFixed(2)}%`, color: 'green' },
              { label: 'Improvement', value: `+${improvement}%`, color: 'cyan' },
              { label: 'Data Integrity', value: `${data.data_integrity_score.toFixed(1)}%`, color: 'purple' },
              { label: 'Samples Removed', value: `${data.poisoned_samples_removed}`, color: 'amber' },
            ].map(r => (
              <div key={r.label} className="compare-row">
                <span className="compare-label">{r.label}</span>
                <span className={`compare-value text-${r.color}`}>{r.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Dataset composition bars ── */}
        <motion.div variants={fadeUp} className="card card-p-lg mb-6">
          <div className="section-title mb-4">Dataset Composition After Purification</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              {
                label: 'Clean Samples',
                pct: Math.max(0, Math.min(100, 100 - (data.poisoned_samples_removed / 10))),
                color: 'var(--green)', gradEnd: '#16a34a', textColor: 'green'
              },
              {
                label: 'Removed',
                pct: Math.max(0, Math.min(100, data.poisoned_samples_removed / 10)),
                color: 'var(--red)', gradEnd: '#b91c1c', textColor: 'red'
              },
            ].map(b => (
              <div key={b.label} style={{ flex: 1 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.label}</span>
                  <span className={`mono text-${b.textColor}`} style={{ fontSize: 12 }}>
                    {b.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-track" style={{ height: 10 }}>
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 1 }}
                    style={{ background: `linear-gradient(90deg, ${b.color}, ${b.gradEnd})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Download feedback banners ── */}
        <AnimatePresence>
          {downloadSuccess && (
            <motion.div
              className="alert alert-success mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>✓</span>
              <div>
                <div style={{ fontWeight: 700 }}>Download started!</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  Your purified dataset is downloading now.
                </div>
              </div>
            </motion.div>
          )}
          {downloadError && (
            <motion.div
              className="alert alert-error mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>⚠</span>
              <div>
                <div style={{ fontWeight: 700 }}>Download Failed</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{downloadError}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action buttons ── */}
        <motion.div variants={fadeUp} className="flex gap-3">
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleDownload}
            disabled={downloading}
            whileHover={{ scale: downloading ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {downloading
              ? <><div className="spinner" />Downloading...</>
              : <><span className="btn-icon">⬇</span>Download Purified Dataset</>
            }
          </motion.button>
          <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
            Analyze Another
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Dashboard
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default PurificationResults;
