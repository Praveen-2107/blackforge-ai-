import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DatasetUpload from './pages/DatasetUpload';
import DatasetAnalysis from './pages/DatasetAnalysis';
import PurificationResults from './pages/PurificationResults';
import AuditLogs from './pages/AuditLogs';
import AIAssistant from './pages/AIAssistant';
import './App.css';

/* ── Loading screen ── */
const LoadingScreen = ({ done }) => (
  <AnimatePresence>
    {!done && (
      <motion.div
        className="loading-screen"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <div className="loading-logo">BLACKFORGE AI</div>
        <div className="loading-sub">INITIALIZING DEFENSE SYSTEM...</div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Topbar breadcrumb ── */
const pageMeta = {
  '/': { label: 'Dashboard', icon: '⬡' },
  '/upload': { label: 'Upload Dataset', icon: '↑' },
  '/audit-logs': { label: 'Audit Logs', icon: '≡' },
  '/analysis': { label: 'Detection Engine', icon: '◎' },
  '/purification': { label: 'Purification', icon: '✦' },
  '/ai': { label: 'AI Assistant', icon: '🤖' },
};

function Topbar() {
  const location = useLocation();
  const key = Object.keys(pageMeta).find(k =>
    k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
  ) || '/';
  const meta = pageMeta[key];

  return (
    <div className="topbar">
      <div className="topbar-breadcrumb">
        <span>BlackForge</span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="active">{meta.label}</span>
      </div>
      <div className="topbar-actions">
        <div className="topbar-badge">
          <div className="status-dot" style={{ width: 6, height: 6 }} />
          LIVE
        </div>
        <div className="topbar-badge">
          ⚠ THREAT: LOW
        </div>
      </div>
    </div>
  );
}

/* ── Page wrapper with animation ── */
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="page-scroll">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
              <Route path="/upload" element={<AnimatedPage><DatasetUpload /></AnimatedPage>} />
              <Route path="/analysis" element={<AnimatedPage><DatasetAnalysis /></AnimatedPage>} />
              <Route path="/analysis/:datasetId" element={<AnimatedPage><DatasetAnalysis /></AnimatedPage>} />
              <Route path="/purification/:purificationId" element={<AnimatedPage><PurificationResults /></AnimatedPage>} />
              <Route path="/audit-logs" element={<AnimatedPage><AuditLogs /></AnimatedPage>} />
              <Route path="/ai" element={<AnimatedPage><AIAssistant /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Router>
      <LoadingScreen done={ready} />
      {/* Subtle scan line */}
      <div className="scan-line" />
      {ready && <AppShell />}
    </Router>
  );
}

export default App;
