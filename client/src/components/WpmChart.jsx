import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function WpmChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="no-chart-data">Not enough data to display chart</div>;
  }

  return (
    <div className="results-chart-wrap" style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis
            dataKey="second"
            stroke="var(--text-secondary)"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            unit="s"
          />
          <YAxis
            stroke="var(--text-secondary)"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            name="WPM"
            stroke="var(--accent-color)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--accent-color)' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="rawWpm"
            name="Raw WPM"
            stroke="var(--text-secondary)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

