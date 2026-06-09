import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function CommandButton({ label, command, color, onClick, disabled }) {
  const colors = {
    amber: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
    blue:  'bg-blue-600 hover:bg-blue-500 border-blue-500',
  };
  return (
    <button
      onClick={() => onClick(command)}
      disabled={disabled}
      className={`${colors[color]} border text-white font-medium px-6 py-3 rounded-xl 
        transition-colors text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed`}>
      {label}
    </button>
  );
}

function StatusDot({ ok }) {
  return (
    <span className={`w-2 h-2 rounded-full inline-block ${ok ? 'bg-green-400' : 'bg-yellow-400'}`} />
  );
}

export default function PLCControl() {
  const [status, setStatus]     = useState(null);
  const [log, setLog]           = useState([]);
  const [sending, setSending]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/plc/status`);
      setStatus(res.data);
      setLog(res.data.recent_commands || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 2000);
    return () => clearInterval(iv);
  }, []);

  const sendCommand = async (command) => {
    setSending(true);
    try {
      const res = await axios.post(`${API}/plc/command`, { command });
      const ack = res.data.response || 'No response';
      setFeedback({ ok: true, msg: `${command} → Arduino: ${ack}` });
      fetchStatus();
    } catch (e) {
      setFeedback({ ok: false, msg: `Failed to send ${command}` });
    }
    setSending(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const pin9High = status?.pin9 === 'HIGH';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Control</h1>
        <p className="text-gray-400 text-sm mt-1">
          Send signals to servo via Arduino bridge on {status?.port || 'COM5'} —{' '}
          <span className={status?.mode === 'hardware' ? 'text-green-400' : 'text-yellow-400'}>
            {status?.mode === 'hardware' ? 'Hardware mode' : 'Simulation mode'}
          </span>
        </p>
      </div>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border font-mono ${
          feedback.ok
            ? 'bg-green-900/40 border-green-700 text-green-300'
            : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left panel */}
        <div className="lg:col-span-1 space-y-4">

          {/* Commands — only 2 buttons */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-medium text-white mb-4">Manual Signals</h2>
            <div className="space-y-3">
              <CommandButton
                label="⚡ Signal Defect (SORT)"
                command="SORT"
                color="amber"
                onClick={sendCommand}
                disabled={sending}
              />
              <CommandButton
                label="↺ Reset Signal (RESET)"
                command="RESET"
                color="blue"
                onClick={sendCommand}
                disabled={sending}
              />
            </div>
            {sending && (
              <p className="text-blue-400 text-xs mt-3 text-center animate-pulse">
                Sending signal...
              </p>
            )}
            <p className="text-gray-500 text-xs mt-4 text-center">
              Signals are sent automatically by YOLO detection
            </p>
          </div>

          {/* System status */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-medium text-white mb-4">System status</h2>
            {status ? (
              <div className="space-y-2 text-sm">

                {/* Arduino connection */}
                <div className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <StatusDot ok={status.connected} />
                    <span className="text-gray-400">Arduino</span>
                  </div>
                  <span className={`font-medium text-xs ${status.connected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {status.connected ? `Connected (${status.port})` : 'Simulation'}
                  </span>
                </div>

                {/* Pin 6 state */}
                <div className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pin9High ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-gray-400">Pin 6 (SORT)</span>
                  </div>
                  <span className={`font-mono font-medium text-xs ${pin9High ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {status.pin9 || 'LOW'}
                  </span>
                </div>

                {/* Last Arduino response */}
                <div className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-gray-400">Last ACK</span>
                  </div>
                  <span className="font-mono font-medium text-xs text-blue-400">
                    {status.last_response || '—'}
                  </span>
                </div>

              </div>
            ) : (
              <p className="text-gray-500 text-sm">Loading...</p>
            )}
          </div>
        </div>

        {/* Signal log */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">Signal log</h2>
              <span className="text-xs text-gray-500">{log.length} signals</span>
            </div>
            {log.length === 0 ? (
              <p className="text-gray-500 text-sm">No signals sent yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...log].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        entry.command === 'SORT' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`} />
                      <span className="text-white font-mono font-medium">{entry.command}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.response && (
                        <span className="font-mono text-xs text-green-400">{entry.response}</span>
                      )}
                      <span className="text-gray-500 text-xs font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString('en-PK')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}