import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const YEAR_COLORS = { '23': '#3B82F6', '24': '#F59E0B', '25': '#22C55E', '26': '#EF4444' };
const YEAR_LABELS = { '23': '2023', '24': '2024', '25': '2025', '26': '2026' };

function yearCode(month) {
  return month.split('-')[1];
}

function getColor(month) {
  return YEAR_COLORS[yearCode(month)] || '#748EA4';
}

function buildLegend(data) {
  const seen = new Set();
  return data
    .map(d => yearCode(d.month))
    .filter(y => { if (seen.has(y)) return false; seen.add(y); return true; })
    .filter(y => YEAR_LABELS[y]);
}

export default function SalesChart({ data }) {
  const legendYears = buildLegend(data);

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        {legendYears.map(y => (
          <span key={y} className="legend-item">
            <span className="legend-dot" style={{ background: YEAR_COLORS[y] }} />
            {YEAR_LABELS[y]}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A4060" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#748EA4', fontSize: 9 }}
            interval={2}
            tickLine={false}
            axisLine={{ stroke: '#2A4060' }}
          />
          <YAxis
            tick={{ fill: '#748EA4', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ background: '#162032', border: '1px solid #2A4060', borderRadius: 8, color: '#F0F4F8' }}
            labelStyle={{ color: '#748EA4', fontSize: 11 }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="qty" name="Units sold" radius={[3, 3, 0, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.month)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
