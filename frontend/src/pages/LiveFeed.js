import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const CLASS_COLORS = {
  'Correct-Bottle': 'bg-green-900/50 text-green-300 border-green-700',
  'Cap-missing':    'bg-red-900/50   text-red-300   border-red-700',
  'Label-missing':  'bg-yellow-900/50 text-yellow-300 border-yellow-700',
};

export default function LiveFeed() {
  const [frame, setFrame]           = useState(null);
  const [detections, setDetections] = useState([]);
  const [streaming, setStreaming]   = useState(false);
  const [fps, setFps]               = useState(0);
  const socketRef  = useRef(null);
  const frameCount = useRef(0);
  const lastTime   = useRef(Date.now());

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('frame', (data) => {
      setFrame(`data:image/jpeg;base64,${data.image}`);
      setDetections(data.detections || []);

      frameCount.current++;
      const now = Date.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const startStream = () => {
    socketRef.current?.emit('start_stream');
    setStreaming(true);
  };

  const stopStream = () => {
    socketRef.current?.emit('stop_stream');
    setStreaming(false);
    setFrame(null);
    setDetections([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Feed</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time YOLO detection stream</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startStream}
            disabled={streaming}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Start stream
          </button>
          <button
            onClick={stopStream}
            disabled={!streaming}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Stop stream
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden aspect-video flex items-center justify-center">
            {frame ? (
              <img src={frame} alt="Live detection feed" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm">Press Start stream to begin</p>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Status: <span className={streaming ? 'text-green-400' : 'text-gray-400'}>{streaming ? 'Live' : 'Stopped'}</span></span>
            <span>FPS: <span className="text-blue-400">{fps}</span></span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h2 className="text-sm font-medium text-white mb-3">Current detections</h2>
          {detections.length === 0 ? (
            <p className="text-gray-500 text-sm">No detections yet</p>
          ) : (
            <div className="space-y-2">
              {detections.map((det, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${CLASS_COLORS[det.class_name] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <div className="font-medium">{det.class_name}</div>
                  <div className="text-xs opacity-75 mt-0.5">
                    Confidence: {(det.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}