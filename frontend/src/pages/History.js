import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const CLASS_COLORS = {
  'Correct-Bottle': 'text-green-400 bg-green-900/30 border-green-700',
  'Cap-missing':    'text-red-400 bg-red-900/30 border-red-700',
  'Label-missing':  'text-yellow-400 bg-yellow-900/30 border-yellow-700',
};

export default function History() {
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(false);
  const perPage = 15;

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/history/`, {
        params: { page: p, per_page: perPage }
      });
      setRecords(res.data.records);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(1); }, []);

  const exportCSV = async () => {
    try {
      const res = await axios.get(`${API}/export/csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `bottleguard_export_${Date.now()}.csv`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = filter === 'all'
    ? records
    : records.filter(r => r.class_name === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">History</h1>
          <p className="text-gray-400 text-sm mt-1">
            {total} total inspections logged
          </p>
        </div>
        <button onClick={exportCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
          ⬇ Export CSV
        </button>
        <button onClick={async () => {
  if (window.confirm('Clear all inspection history?')) {
    await axios.delete(`${API}/history/clear`);
    fetchHistory(1);
  }
}}
className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">
  🗑 Clear history
</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { value: 'all',            label: 'All' },
          { value: 'Correct-Bottle', label: '✓ Correct' },
          { value: 'Cap-missing',    label: '✗ Cap missing' },
          { value: 'Label-missing',  label: '✗ Label missing' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-400 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500">
                    {(page - 1) * perPage + i + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                    {new Date(r.timestamp).toLocaleString('en-PK')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${CLASS_COLORS[r.class_name] || 'text-gray-400'}`}>
                      {r.class_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${r.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs">{(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.is_defective ? 'text-red-400' : 'text-green-400'}`}>
                      {r.is_defective ? '✗ DEFECT' : '✓ OK'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <span className="text-xs text-gray-500">
            Page {page} of {pages} — {total} records
          </span>
          <div className="flex gap-2">
            <button onClick={() => fetchHistory(page - 1)} disabled={page <= 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors">
              ← Prev
            </button>
            <button onClick={() => fetchHistory(page + 1)} disabled={page >= pages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}