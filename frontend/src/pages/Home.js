import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function StatCard({ label, value, color }) {
  const colors = {
    blue:  'text-blue-400',
    green: 'text-green-400',
    red:   'text-red-400',
    amber: 'text-yellow-400',
  };
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-semibold ${colors[color]}`}>{value}</p>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/history/stats`);
      setStats(res.data);
    } catch {
      setError('Could not reach backend.');
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time bottle inspection overview</p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Inspected" value={stats?.total          ?? '—'} color="blue"  />
        <StatCard label="Correct"         value={stats?.correct        ?? '—'} color="green" />
        <StatCard label="Defective"       value={stats?.defective      ?? '—'} color="red"   />
        <StatCard label="Cap Missing"     value={stats?.cap_missing    ?? '—'} color="amber" />
        <StatCard label="Label Missing"   value={stats?.label_missing  ?? '—'} color="amber" />
        <StatCard label="Defect Rate"     value={stats ? `${stats.defect_rate}%` : '—'} color="red" />
      </div>

      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h2 className="text-base font-medium text-white mb-3">System status</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Flask backend', status: 'Online',      ok: true  },
            { label: 'YOLO model',    status: 'Loaded',      ok: true  },
            { label: 'PLC link',      status: 'Simulation',  ok: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 bg-gray-900 rounded-lg px-4 py-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className="text-gray-400">{item.label}</span>
              <span className={`ml-auto font-medium ${item.ok ? 'text-green-400' : 'text-yellow-400'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}