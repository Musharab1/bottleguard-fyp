import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Legend
} from 'recharts';

const API = 'http://localhost:5000/api';

export default function Analytics() {
  const [stats, setStats]   = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const [s, h] = await Promise.all([
        axios.get(`${API}/history/stats`),
        axios.get(`${API}/history/`, { params: { page: 1, per_page: 500 } })
      ]);
      setStats(s.data);
      setHistory(h.data.records);
    };
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, []);

  // Pie chart data
  const pieData = stats ? [
    { name: 'Correct',       value: stats.correct,       color: '#22c55e' },
    { name: 'Cap missing',   value: stats.cap_missing,   color: '#ef4444' },
    { name: 'Label missing', value: stats.label_missing, color: '#eab308' },
  ].filter(d => d.value > 0) : [];

  // Line chart — last 20 detections defect trend
  const lineData = history.slice(0, 50).reverse().map((r, i) => ({
    index: i + 1,
    defect: r.is_defective ? 1 : 0,
    confidence: Math.round(r.confidence * 100),
  }));

  // Bar chart — count by class
  const barData = stats ? [
    { name: 'Correct',       count: stats.correct },
    { name: 'Cap missing',   count: stats.cap_missing },
    { name: 'Label missing', count: stats.label_missing },
  ] : [];

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f9fafb',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Detection trends and class distribution</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total inspected', value: stats?.total ?? '—',       color: 'text-blue-400' },
          { label: 'Defect rate',     value: stats ? `${stats.defect_rate}%` : '—', color: 'text-red-400' },
          { label: 'Pass rate',       value: stats ? `${(100 - stats.defect_rate).toFixed(2)}%` : '—', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="text-sm font-medium text-white mb-4">Class distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
              No data yet — start the stream
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="text-sm font-medium text-white mb-4">Count by class</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.name === 'Correct' ? '#22c55e' :
                    entry.name === 'Cap missing' ? '#ef4444' : '#eab308'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-sm font-medium text-white mb-4">
          Confidence trend — last 50 detections
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="index" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
            <Line type="monotone" dataKey="confidence" stroke="#3b82f6"
              dot={false} strokeWidth={2} name="Confidence %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}