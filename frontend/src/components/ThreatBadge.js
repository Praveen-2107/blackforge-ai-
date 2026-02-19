import React from 'react';
import { motion } from 'framer-motion';

function ThreatBadge({ level, confidence }) {
  const getBadgeStyle = () => {
    if (confidence < 30) return 'badge-safe';
    if (confidence < 70) return 'badge-warning';
    return 'badge-danger';
  };

  const getLabel = () => {
    if (confidence < 30) return '✓ Safe';
    if (confidence < 70) return '⚠ Suspicious';
    return '✗ Poisoned';
  };

  return (
    <motion.div
      className={`px-4 py-2 rounded-lg font-bold text-lg ${getBadgeStyle()}`}
      whileHover={{ scale: 1.1 }}
    >
      {getLabel()}
    </motion.div>
  );
}

export default ThreatBadge;
