import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/', icon: '⬡', label: 'Dashboard' },
      { path: '/upload', icon: '↑', label: 'Upload Dataset', badge: 'NEW' },
      { path: '/audit-logs', icon: '≡', label: 'Audit Logs' },
    ]
  },
  {
    label: 'Analysis',
    items: [
      { path: '/analysis', icon: '◎', label: 'Detection Engine' },
      { path: '/upload', icon: '✦', label: 'Purification', badge: 'VIA UPLOAD' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/ai', icon: '🤖', label: 'AI Assistant', badge: 'NEW' },
    ]
  }
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    // /analysis should highlight for both /analysis and /analysis/:id
    if (path === '/analysis') return location.pathname.startsWith('/analysis');
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 280, damping: 28 }}
    >
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <div className="sidebar-logo-icon">⚔</div>
        <div className="sidebar-logo-title">BlackForge AI</div>
        <div className="sidebar-logo-sub">v2.1.4 · DEFENSE PROTOCOL</div>
      </div>

      {/* System status */}
      <div className="sidebar-status">
        <div className="status-dot" />
        <span className="status-text">SYSTEM ONLINE · THREAT: LOW</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <motion.button
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-item-badge">{item.badge}</span>
                )}
              </motion.button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">CLEARANCE: ALPHA · AUTHORIZED</div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
