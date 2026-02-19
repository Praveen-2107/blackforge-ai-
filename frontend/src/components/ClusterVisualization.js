import React from 'react';
import { motion } from 'framer-motion';

function ClusterVisualization({ data }) {
  if (!data || !data.points) {
    return <div className="text-center p-8">Loading visualization...</div>;
  }

  const points = data.points;
  const bounds = data.bounds;
  const padding = 40;
  const width = 600;
  const height = 500;

  const scaleX = (width - 2 * padding) / (bounds.x_max - bounds.x_min + 1);
  const scaleY = (height - 2 * padding) / (bounds.y_max - bounds.y_min + 1);

  return (
    <motion.svg
      width={width}
      height={height}
      className="border border-cyan-500/30 rounded-lg bg-slate-900/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`vline-${i}`}
          x1={padding + (i * (width - 2 * padding)) / 4}
          y1={padding}
          x2={padding + (i * (width - 2 * padding)) / 4}
          y2={height - padding}
          stroke="rgba(0, 217, 255, 0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Points */}
      {points.map((point, idx) => (
        <motion.circle
          key={idx}
          cx={padding + (point.x - bounds.x_min) * scaleX}
          cy={height - padding - (point.y - bounds.y_min) * scaleY}
          r={point.suspicious ? 6 : 4}
          fill={point.suspicious ? '#ff0033' : '#00d9ff'}
          opacity={point.suspicious ? 0.9 : 0.6}
          whileHover={{ r: point.suspicious ? 8 : 6 }}
        />
      ))}
    </motion.svg>
  );
}

export default ClusterVisualization;
