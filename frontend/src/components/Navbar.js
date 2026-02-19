import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload', icon: '⬆️' },
    { path: '/audit-logs', label: 'Audit Logs', icon: '📋' }
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.8, 
        type: 'spring', 
        stiffness: 300,
        damping: 30 
      }}
      className="fixed top-0 w-full glass-panel backdrop-blur-lg border-b-2 z-50"
      style={{
        borderColor: 'var(--glass-border)',
        background: 'linear-gradient(135deg, rgba(15, 23, 50, 0.85) 0%, rgba(20, 30, 65, 0.85) 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative">
        
        {/* Enhanced Logo with animation */}
        <motion.div
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <motion.div
            className="text-3xl"
            animate={{ 
              rotateY: [0, 360]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            ⚔️
          </motion.div>
          
          <div>
            <motion.h1
              className="text-2xl font-bold text-glow"
              style={{
                background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'var(--text-glow)'
              }}
            >
              BlackForge AI
            </motion.h1>
            <motion.p 
              className="text-xs text-gray-400 font-mono tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              v2.1.4-DEFENSE_PROTOCOL
            </motion.p>
          </div>
        </motion.div>

        {/* System Status Indicator */}
        <motion.div 
          className="hidden md:flex items-center space-x-4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-safe-green"
              animate={{ 
                boxShadow: [
                  'var(--shadow-green)',
                  '0 0 15px rgba(0, 255, 65, 0.8)',
                  'var(--shadow-green)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ backgroundColor: 'var(--safe-green)' }}
            />
            <span className="text-xs font-mono text-gray-300">SYSTEM ONLINE</span>
          </div>
          
          <div className="text-xs text-cyan-300/70 font-mono tracking-wider">
            ADVERSARIAL ML DEFENSE PLATFORM
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8">
          {navItems.map((item, index) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActivePath(item.path) 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-300' 
                  : 'hover:bg-cyan-400/10 hover:text-cyan-300 text-gray-300'
              }`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: isActivePath(item.path) 
                  ? '0 0 20px rgba(0, 217, 255, 0.3)' 
                  : '0 0 10px rgba(0, 217, 255, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-mono tracking-wide">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 rounded-lg glass-panel"
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-cyan-400"
          >
            {isOpen ? '✕' : '☰'}
          </motion.div>
        </motion.button>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-panel border-t border-cyan-500/30"
          >
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActivePath(item.path) 
                      ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300' 
                      : 'hover:bg-cyan-400/10 text-gray-300'
                  }`}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 10 }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-mono">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber border effect */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </motion.nav>
  );
}

export default Navbar;
