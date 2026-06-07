import { useEffect, useRef, useState, Suspense } from 'react';
import { io } from 'socket.io-client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';

const SOCKET_URL = 'http://localhost:5000';

const CLASS_COLORS = {
  'Correct-Bottle': 'bg-green-900/50 text-green-300 border-green-700',
  'Cap-missing':    'bg-red-900/50   text-red-300   border-red-700',
  'Label-missing':  'bg-yellow-900/50 text-yellow-300 border-yellow-700',
};

const CLASS_3D_COLORS = {
  'Correct-Bottle': '#22c55e',
  'Cap-missing':    '#ef4444',
  'Label-missing':  '#eab308',
  'default':        '#3b82f6',
};

// ─── 3D Bottle Component ───────────────────────────────────────────────────
function Bottle({ position, color, label, confidence, isNew }) {
  const meshRef   = useRef();
  const glowRef   = useRef();
  const [scale, setScale] = useState(0.1);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Gentle float animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
    }
    // Pop-in scale animation
    if (scale < 1) setScale(s => Math.min(s + 0.08, 1));
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Bottle body */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.9, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Bottle neck */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 0.3, 16]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </mesh>

      {/* Cap */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
        <meshStandardMaterial
          color={label === 'Cap-missing' ? '#374151' : '#ffffff'}
          roughness={0.3}
        />
      </mesh>

      {/* Label band */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.185, 0.225, 0.45, 16]} />
        <meshStandardMaterial
          color={label === 'Label-missing' ? '#1f2937' : '#ffffff'}
          roughness={0.8}
          transparent
          opacity={label === 'Label-missing' ? 0.3 : 0.9}
        />
      </mesh>

      {/* Floating label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label === 'Correct-Bottle' ? '✓ OK' : label === 'Cap-missing' ? '✗ Cap' : '✗ Label'}
      </Text>

      {/* Confidence badge */}
      <Text
        position={[0, 0.98, 0]}
        fontSize={0.13}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {(confidence * 100).toFixed(0)}%
      </Text>
    </group>
  );
}

// ─── Conveyor Belt ─────────────────────────────────────────────────────────
function ConveyorBelt() {
  const beltRef = useRef();
  useFrame((state) => {
    if (beltRef.current) {
      beltRef.current.material.map.offset.x -= 0.003;
    }
  });

  return (
    <group>
      {/* Belt surface */}
      <mesh position={[0, -0.52, 0]} receiveShadow>
        <boxGeometry args={[8, 0.12, 1.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Belt edges */}
      <mesh position={[0, -0.44, 0.95]}>
        <boxGeometry args={[8, 0.18, 0.08]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.44, -0.95]}>
        <boxGeometry args={[8, 0.18, 0.08]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Belt stripes */}
      {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => (
        <mesh key={i} position={[x, -0.455, 0]}>
          <boxGeometry args={[0.06, 0.02, 1.8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scan Line Effect ──────────────────────────────────────────────────────
function ScanLine() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.8) * 3;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.2, 0]}>
      <boxGeometry args={[0.04, 1.8, 1.9]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
    </mesh>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene({ detections }) {
  const positions = [
    [-2.2, -0.05, 0],
    [ 0,   -0.05, 0],
    [ 2.2, -0.05, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, 2]} intensity={0.6} color="#38bdf8" />
      <pointLight position={[ 4, 3, 2]} intensity={0.6} color="#818cf8" />

      <ConveyorBelt />
      <ScanLine />

      <Grid
        position={[0, -0.6, 0]}
        args={[20, 20]}
        cellSize={0.6}
        cellThickness={0.5}
        cellColor="#1e3a5f"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#1d4ed8"
        fadeDistance={12}
        fadeStrength={1}
        infiniteGrid
      />

      {detections.slice(0, 3).map((det, i) => (
        <Bottle
          key={i}
          position={positions[i]}
          color={CLASS_3D_COLORS[det.class_name] || CLASS_3D_COLORS.default}
          label={det.class_name}
          confidence={det.confidence}
          isNew={true}
        />
      ))}

      {/* Fill empty slots with idle bottles */}
      {detections.length === 0 && positions.map((pos, i) => (
        <Bottle
          key={`idle-${i}`}
          position={pos}
          color="#3b82f6"
          label="Correct-Bottle"
          confidence={0}
          isNew={false}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// ─── Main LiveFeed Component ───────────────────────────────────────────────
export default function LiveFeed() {
  const [frame, setFrame]           = useState(null);
  const [detections, setDetections] = useState([]);
  const [streaming, setStreaming]   = useState(false);
  const [fps, setFps]               = useState(0);
  const [activeTab, setActiveTab]   = useState('camera'); // 'camera' | '3d'
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

  const startStream = () => { socketRef.current?.emit('start_stream'); setStreaming(true); };
  const stopStream  = () => { socketRef.current?.emit('stop_stream');  setStreaming(false); setFrame(null); setDetections([]); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Feed</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time YOLO detection stream</p>
        </div>
        <div className="flex gap-3">
          <button onClick={startStream} disabled={streaming}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors">
            Start stream
          </button>
          <button onClick={stopStream} disabled={!streaming}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors">
            Stop stream
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('camera')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'camera' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          📷 Camera feed
        </button>
        <button onClick={() => setActiveTab('3d')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === '3d' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🧊 3D view
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">

          {/* Camera tab */}
          {activeTab === 'camera' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden aspect-video flex items-center justify-center">
              {frame ? (
                <img src={frame} alt="Live detection feed" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">Press Start stream to begin</p>
                </div>
              )}
            </div>
          )}

          {/* 3D tab */}
          {activeTab === '3d' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden"
              style={{ height: '420px' }}>
              <Canvas
                shadows
                camera={{ position: [0, 3, 7], fov: 50 }}
                gl={{ antialias: true }}
              >
                <Suspense fallback={null}>
                  <Scene detections={detections} />
                </Suspense>
              </Canvas>
            </div>
          )}

          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Status: <span className={streaming ? 'text-green-400' : 'text-gray-400'}>{streaming ? 'Live' : 'Stopped'}</span></span>
            <span>FPS: <span className="text-blue-400">{fps}</span></span>
            <span>Detections: <span className="text-purple-400">{detections.length}</span></span>
          </div>
        </div>

        {/* Detection panel */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h2 className="text-sm font-medium text-white mb-3">
            Current detections
            {detections.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {detections.length}
              </span>
            )}
          </h2>
          {detections.length === 0 ? (
            <p className="text-gray-500 text-sm">No detections yet</p>
          ) : (
            <div className="space-y-2">
              {detections.map((det, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${CLASS_COLORS[det.class_name] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <div className="font-medium">{det.class_name}</div>
                  <div className="flex justify-between text-xs opacity-75 mt-0.5">
                    <span>Confidence: {(det.confidence * 100).toFixed(1)}%</span>
                    <span className={det.is_defective ? 'text-red-400' : 'text-green-400'}>
                      {det.is_defective ? 'DEFECT' : 'OK'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3D view hint */}
          {activeTab === 'camera' && detections.length > 0 && (
            <button onClick={() => setActiveTab('3d')}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors">
              🧊 View in 3D
            </button>
          )}
        </div>
      </div>
    </div>
  );
}