import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

function CommandButton({ label, command, color, onClick }) {
  const colors = {
    green:  'bg-green-600 hover:bg-green-500 border-green-500',
    red:    'bg-red-600 hover:bg-red-500 border-red-500',
    blue:   'bg-blue-600 hover:bg-blue-500 border-blue-500',
    amber:  'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
  };
  return (
    <button onClick={() => onClick(command)}
      className={`${colors[color]} border text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm w-full`}>
      {label}
    </button>
  );
}

export default function PLCControl() {
  const [status, setStatus]   = useState(null);
  const [log, setLog]         = useState([]);
  const [sending, setSending] = useState(false);
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
      setFeedback({ ok: true, msg: `${command} sent — ${res.data.response}` });
      fetchStatus();
    } catch (e) {
      setFeedback({ ok: false, msg: `Failed to send ${command}` });
    }
    setSending(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">PLC Control</h1>
        <p className="text-gray-400 text-sm mt-1">Send commands to the conveyor system</p>
      </div>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
          feedback.ok
            ? 'bg-green-900/40 border-green-700 text-green-300'
            : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Command panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-sm font-medium text-white mb-4">Commands</h2>
            <div className="space-y-3">
              <CommandButton label="▶ Start conveyor" command="START" color="green" onClick={sendCommand} />
              <CommandButton label="⏹ Stop conveyor"  command="STOP"  color="red"   onClick={sendCommand} />
              <CommandButton label="↪ Sort (eject defect)" command="SORT" color="amber" onClick={sendCommand} />
              <CommandButton label="↺ Reset actuator" command="RESET" color="blue"  onClick={sendCommand} />
            </div>

            {sending && (
              <p className="text-blue-400 text-xs mt-3 text-center animate-pulse">
                Sending command...
              </p>
            )}
          </div>

          {/* Status panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mt-4">
            <h2 className="text-sm font-medium text-white mb-4">System status</h2>
            {status ? (
              <div className="space-y-3 text-sm">
                {[
                  {
                    label: 'Connection',
                    value: status.mode === 'hardware' ? 'Hardware' : 'Simulation',
                    ok: status.mode === 'hardware'
                  },
                  {
                    label: 'Arduino port',
                    value: status.port || 'COM8',
                    ok: status.connected
                  },
                  {
                    label: 'Conveyor',
                    value: status.conveyor_running ? 'Running' : 'Stopped',
                    ok: status.conveyor_running
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className={`font-medium text-xs ${item.ok ? 'text-green-400' : 'text-yellow-400'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Loading...</p>
            )}
          </div>
        </div>

        {/* Command log */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">Command log</h2>
              <span className="text-xs text-gray-500">{log.length} commands</span>
            </div>
            {log.length === 0 ? (
              <p className="text-gray-500 text-sm">No commands sent yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...log].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        entry.command === 'START' ? 'bg-green-400' :
                        entry.command === 'STOP'  ? 'bg-red-400' :
                        entry.command === 'SORT'  ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></span>
                      <span className="text-white font-mono font-medium">{entry.command}</span>
                    </div>
                    <span className="text-gray-500 text-xs font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString('en-PK')}
                    </span>
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