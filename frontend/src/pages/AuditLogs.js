import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import API_BASE from '../config';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const MOCK_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 60000).toISOString(), action: 'DETECTION_RUN', detection_method: 'spectral', threat_score: 72.4, threat_grade: 'D', mitigation_applied: false },
  { id: 2, timestamp: new Date(Date.now() - 300000).toISOString(), action: 'PURIFICATION', detection_method: 'activation', threat_score: 45.1, threat_grade: 'C', mitigation_applied: true },
  { id: 3, timestamp: new Date(Date.now() - 900000).toISOString(), action: 'DETECTION_RUN', detection_method: 'influence', threat_score: 18.3, threat_grade: 'A', mitigation_applied: false },
  { id: 4, timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'UPLOAD', detection_method: '—', threat_score: 0, threat_grade: 'A', mitigation_applied: false },
  { id: 5, timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'DETECTION_RUN', detection_method: 'spectral', threat_score: 88.9, threat_grade: 'F', mitigation_applied: true },
];

// Ensure the ISO string from SQLite (stored as UTC, no 'Z') is parsed as UTC
function formatLocalTime(isoString) {
  if (!isoString) return '—';
  // Append 'Z' if missing so JS treats it as UTC, then converts to local
  const normalized = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  return new Date(normalized).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function gradeColor(g) {
  if (g === 'A') return 'green';
  if (g <= 'C') return 'amber';
  return 'red';
}

function scoreColor(s) {
  if (s > 60) return 'red';
  if (s > 30) return 'amber';
  return 'green';
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/audit/logs`);
        setLogs(res.data.logs);
      } catch {
        setLogs(MOCK_LOGS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filters = ['ALL', 'DETECTION_RUN', 'PURIFICATION', 'UPLOAD'];
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.action === filter);

  const stats = {
    total: logs.length,
    highRisk: logs.filter(l => l.threat_score > 60).length,
    mitigated: logs.filter(l => l.mitigation_applied).length,
    avgScore: logs.length ? (logs.reduce((a, l) => a + l.threat_score, 0) / logs.length).toFixed(1) : 0,
  };

  return (
    <div className="page-content">
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={fadeUp} className="page-header">
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete history of detections, mitigations, and threat assessments</p>
        </motion.div>

        {/* Summary stats */}
        <motion.div variants={fadeUp} className="grid-4 mb-6">
          {[
            { label: 'Total Events', value: stats.total, color: 'cyan' },
            { label: 'High Risk', value: stats.highRisk, color: 'red' },
            { label: 'Mitigated', value: stats.mitigated, color: 'green' },
            { label: 'Avg Threat Score', value: stats.avgScore, color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="card card-p stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value text-${s.color}`}>{s.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Filter tabs + table */}
        <motion.div variants={fadeUp} className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="flex gap-2">
              {filters.map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }} className="mono">
              {filtered.length} records
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading audit logs...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No records found for this filter.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Method</th>
                  <th>Threat Score</th>
                  <th>Grade</th>
                  <th>Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <td className="mono" style={{ fontSize: 11 }}>
                      {formatLocalTime(log.timestamp)}
                    </td>
                    <td>
                      <span className={`badge badge-${log.action === 'DETECTION_RUN' ? 'cyan' :
                        log.action === 'PURIFICATION' ? 'purple' : 'green'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>
                      {log.detection_method}
                    </td>
                    <td>
                      <span className={`mono text-${scoreColor(log.threat_score)}`} style={{ fontWeight: 700 }}>
                        {log.threat_score.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`mono text-${gradeColor(log.threat_grade)}`} style={{ fontWeight: 700, fontSize: 14 }}>
                        {log.threat_grade}
                      </span>
                    </td>
                    <td>
                      {log.mitigation_applied
                        ? <span className="badge badge-green">✓ Applied</span>
                        : <span className="badge" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'transparent' }}>None</span>
                      }
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}

export default AuditLogs;
