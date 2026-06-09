import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home       from './pages/Home';
import LiveFeed   from './pages/LiveFeed';
import Analytics  from './pages/Analytics';
import History    from './pages/History';
import PLCControl from './pages/PLCControl';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const [sysStatus, setSysStatus] = useState({
    camera: false, plc: false, system: false
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [, plc] = await Promise.all([
          axios.get('http://localhost:5000/api/detection/status'),
          axios.get('http://localhost:5000/api/plc/status'),
        ]);
        setSysStatus({
          camera: true,
          plc:    plc.data.connected,
          system: true,
        });
      } catch {
        setSysStatus({ camera: false, plc: false, system: false });
      }
    };
    fetch();
    const iv = setInterval(fetch, 3000);
    return () => clearInterval(iv);
  }, []);

  const links = [
    { to: '/',          label: 'Home'        },
    { to: '/live',      label: 'Live Feed'   },
    { to: '/analytics', label: 'Analytics'   },
    { to: '/history',   label: 'History'     },
    { to: '/plc',       label: 'Control' },
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="bg-blue-600 rounded-lg p-1.5">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <span className="font-semibold text-lg tracking-tight">BottleGuard</span>
        <span className="text-gray-500 text-xs ml-1">UET FYP 2026</span>
      </div>

      <div className="flex items-center gap-1">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md text-sm transition-colors duration-150 ${
                isActive ? 'bg-blue-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
        <StatusDot label="Camera" active={sysStatus.camera} />
        <StatusDot label="Control"    active={sysStatus.plc}    amber={!sysStatus.plc} />
        <StatusDot label="System" active={sysStatus.system} />
      </div>
    </nav>
  );
}

function StatusDot({ label, active, amber }) {
  const color = active ? 'bg-green-400' : amber ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      {label}
    </span>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="p-6">
          <Routes>
            <Route path="/"          element={<Home />}       />
            <Route path="/live"      element={<LiveFeed />}   />
            <Route path="/analytics" element={<Analytics />}  />
            <Route path="/history"   element={<History />}    />
            <Route path="/plc"       element={<PLCControl />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}