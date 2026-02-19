import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

function StatCard({ label, value, suffix = '', color, delta }) {
  return (
    <motion.div variants={fadeUp} className="card card-p stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value text-${color}`}>{value}{suffix}</div>
      {delta && (
        <div className={`stat-change text-${delta > 0 ? 'green' : 'red'}`}>
          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} this session
        </div>
      )}
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, tags, onClick, accentColor = 'cyan' }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`card feature-card card-glow-${accentColor}`}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="feature-card-icon" style={{
        background: accentColor === 'purple' ? 'var(--purple-dim)' : 'var(--cyan-dim)',
        borderColor: accentColor === 'purple' ? 'rgba(168,85,247,0.3)' : 'var(--border-md)'
      }}>
        {icon}
      </div>
      <div>
        <div className="feature-card-title">{title}</div>
      </div>
      <div className="feature-card-desc">{desc}</div>
      <div className="feature-card-tags">
        {tags.map(t => <span key={t} className="feature-tag">{t}</span>)}
      </div>
    </motion.div>
  );
}

function ThreatBar({ label, value, color }) {
  return (
    <div className="threat-meter mb-3">
      <div className="threat-meter-label">
        <span>{label}</span>
        <span className={`text-${color} mono`}>{value}%</span>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: color === 'red'
              ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
              : color === 'amber'
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, var(--cyan), var(--purple))'
          }}
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ datasets: 42, threats: 156, purified: 38, recovery: 87 });

  useEffect(() => {
    const iv = setInterval(() => {
      setStats(p => ({
        datasets: p.datasets + Math.floor(Math.random() * 2),
        threats: p.threats + Math.floor(Math.random() * 3),
        purified: p.purified + Math.floor(Math.random() * 2),
        recovery: Math.max(85, Math.min(95, p.recovery + (Math.random() - 0.5) * 2))
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* ── Page header ── */}
        <motion.div variants={fadeUp} className="page-header">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-title">Security Dashboard</h1>
            <span className="badge badge-green">LIVE</span>
          </div>
          <p className="page-subtitle">
            Adversarial ML defense platform · Real-time threat monitoring
          </p>
        </motion.div>

        {/* ── Stat row ── */}
        <div className="grid-4 mb-6">
          <StatCard label="Datasets Analyzed" value={stats.datasets} color="cyan" delta={2} />
          <StatCard label="Threats Neutralized" value={stats.threats} color="red" delta={3} />
          <StatCard label="Datasets Purified" value={stats.purified} color="green" delta={1} />
          <StatCard label="Avg Recovery Rate" value={Math.round(stats.recovery)} suffix="%" color="purple" />
        </div>

        {/* ── Main content: features + threat panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }} className="mb-6">

          {/* Feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div variants={fadeUp}>
              <div className="section-header">
                <span className="section-title">Core Modules</span>
              </div>
            </motion.div>

            <div className="grid-3">
              <FeatureCard
                icon="🔍"
                title="DETECTION ENGINE"
                desc="Spectral signatures, activation clustering, and influence functions for deep threat analysis."
                tags={['Spectral', 'Clustering', 'Influence']}
                accentColor="cyan"
                onClick={() => navigate('/upload')}
              />
              <FeatureCard
                icon="🛡️"
                title="MITIGATION CORE"
                desc="Automated removal of poisoned samples with clean dataset reconstruction and integrity checks."
                tags={['Filtering', 'Reconstruction', 'Integrity']}
                accentColor="purple"
                onClick={() => navigate('/upload')}
              />
              <FeatureCard
                icon="📋"
                title="AUDIT SYSTEM"
                desc="Comprehensive threat tracking, recovery metrics, and compliance logging with analytics."
                tags={['Tracking', 'Metrics', 'Compliance']}
                accentColor="cyan"
                onClick={() => navigate('/audit-logs')}
              />
            </div>

            {/* CTA card */}
            <motion.div variants={fadeUp} className="card card-p" style={{ background: 'linear-gradient(135deg, rgba(0,217,255,0.06), rgba(168,85,247,0.06))', borderColor: 'var(--border-md)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    Ready to scan a dataset?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Upload your ML dataset and run full adversarial analysis in seconds.
                  </div>
                </div>
                <motion.button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/upload')}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flexShrink: 0, marginLeft: 24 }}
                >
                  <span className="btn-icon">🚀</span>
                  Deploy Analysis
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right panel: threat overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div variants={fadeUp} className="card card-p">
              <div className="section-header mb-3">
                <span className="section-title">Threat Overview</span>
                <span className="badge badge-amber">ALPHA</span>
              </div>
              <ThreatBar label="Data Poisoning" value={72} color="red" />
              <ThreatBar label="Backdoor Attacks" value={45} color="amber" />
              <ThreatBar label="Adversarial Inputs" value={31} color="amber" />
              <ThreatBar label="Model Integrity" value={88} color="cyan" />
            </motion.div>

            <motion.div variants={fadeUp} className="card card-p">
              <div className="section-title mb-3">Detection Methods</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Spectral Signatures', acc: '94%', color: 'cyan' },
                  { name: 'Activation Clustering', acc: '91%', color: 'purple' },
                  { name: 'Influence Functions', acc: '88%', color: 'green' },
                ].map(m => (
                  <div key={m.name} className="method-item">
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.name}</span>
                    <span className={`badge badge-${m.color}`}>{m.acc}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="card card-p">
              <div className="section-title mb-3">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary w-full" onClick={() => navigate('/upload')}>
                  <span>↑</span> Upload Dataset
                </button>
                <button className="btn btn-secondary w-full" onClick={() => navigate('/audit-logs')}>
                  <span>≡</span> View Audit Logs
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Recent activity ── */}
        <motion.div variants={fadeUp} className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="section-title">Recent Activity</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit-logs')}>
                View all →
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Dataset</th>
                <th>Threat Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: '10:41 AM', event: 'Detection Run', ds: 'train_v3.csv', score: 72.4, status: 'danger' },
                { time: '10:28 AM', event: 'Purification', ds: 'model_data.zip', score: 45.1, status: 'warn' },
                { time: '09:55 AM', event: 'Detection Run', ds: 'dataset_01.csv', score: 18.3, status: 'safe' },
                { time: '09:30 AM', event: 'Upload', ds: 'images_v2.tar.gz', score: 0, status: 'safe' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 12 }}>{row.time}</td>
                  <td style={{ fontWeight: 600 }}>{row.event}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{row.ds}</td>
                  <td>
                    <span className={`mono text-${row.score > 60 ? 'red' : row.score > 30 ? 'amber' : 'green'}`}>
                      {row.score.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${row.status === 'danger' ? 'red' : row.status === 'warn' ? 'amber' : 'green'}`}>
                      {row.status === 'danger' ? 'HIGH' : row.status === 'warn' ? 'MED' : 'CLEAN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default Dashboard;
