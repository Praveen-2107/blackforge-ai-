import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ResultsChart({ data, type = 'line' }) {
  if (!data) return null;

  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.2)" />
          <XAxis stroke="rgba(0, 217, 255, 0.5)" />
          <YAxis stroke="rgba(0, 217, 255, 0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 50, 0.9)',
              border: '1px solid rgba(0, 217, 255, 0.5)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <DataComponent dataKey="value" stroke="#00d9ff" fill="#00d9ff" />
        </ChartComponent>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default ResultsChart;
