import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cpu, ShieldCheck, AlertOctagon } from 'lucide-react';

interface ThreeForensicCanvasProps {
  mode?: 'smt' | 'anomaly' | 'lattice';
  activeConflict?: boolean;
}

export const ThreeForensicCanvas: React.FC<ThreeForensicCanvasProps> = ({
  mode: initialMode = 'smt',
  activeConflict = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'smt' | 'anomaly' | 'lattice'>(
    activeConflict ? 'anomaly' : initialMode
  );

  useEffect(() => {
    if (activeConflict) {
      setMode('anomaly');
    }
  }, [activeConflict]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06080d, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Group for mouse rotation
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Color definitions based on mode
    const getColors = (m: 'smt' | 'anomaly' | 'lattice') => {
      if (m === 'anomaly') {
        return {
          primary: 0xf43f5e, // ruby red
          secondary: 0xfbbf24, // amber
          wire: 0xff2d55,
          glow: 0x9f1239,
        };
      }
      if (m === 'lattice') {
        return {
          primary: 0x10b981, // emerald
          secondary: 0x06b6d4, // cyan
          wire: 0x34d399,
          glow: 0x064e3b,
        };
      }
      // smt
      return {
        primary: 0x00f0ff, // neon cyan
        secondary: 0x3b82f6, // royal blue
        wire: 0x38bdf8,
        glow: 0x1e3a8a,
      };
    };

    let colors = getColors(mode);

    // Central 3D Icosahedron (The SMT Constraint Core)
    const geoCore = new THREE.IcosahedronGeometry(1.2, 1);
    const matCore = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(geoCore, matCore);
    mainGroup.add(coreMesh);

    // Wireframe Outer Cage
    const geoWire = new THREE.IcosahedronGeometry(1.28, 2);
    const matWire = new THREE.MeshBasicMaterial({
      color: colors.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const wireMesh = new THREE.Mesh(geoWire, matWire);
    mainGroup.add(wireMesh);

    // Glowing Inner Singularity
    const geoInner = new THREE.SphereGeometry(0.45, 16, 16);
    const matInner = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.9,
    });
    const innerMesh = new THREE.Mesh(geoInner, matInner);
    mainGroup.add(innerMesh);

    // Orbiting Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.4, 0.01, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    mainGroup.add(ring2);

    // Particle Swarm (Claims & Evidence Nodes)
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      scales[i] = Math.random();
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(14, 28, colors.primary, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(colors.primary, 3, 20);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(colors.secondary, 2, 15);
    pointLight2.position.set(-3, -2, -2);
    scene.add(pointLight2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseX = (x / rect.width) * 2 - 1;
      mouseY = -(y / rect.height) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera tilt & rotation
      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (mouseY * 0.3 - targetY) * 0.05;

      mainGroup.rotation.y += delta * 0.25 + targetX * 0.02;
      mainGroup.rotation.x = Math.sin(time * 0.3) * 0.15 + targetY * 0.3;

      // Polyhedron breathing & inner core pulsation
      const pulse = Math.sin(time * 2.5) * 0.05 + 1;
      innerMesh.scale.set(pulse, pulse, pulse);

      ring1.rotation.z += delta * 0.35;
      ring2.rotation.z -= delta * 0.25;

      // Floating grid subtle pulse
      gridHelper.position.y = -2 + Math.sin(time * 0.8) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geoCore.dispose();
      geoWire.dispose();
      geoInner.dispose();
      particleGeo.dispose();
      matCore.dispose();
      matWire.dispose();
      matInner.dispose();
      particleMat.dispose();
    };
  }, [mode]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/20">
      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Futuristic HUD overlay */}
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider text-cyan-300 uppercase mono">
            {mode === 'smt'
              ? 'Z3 SMT THEOREM SOLVER CORE'
              : mode === 'anomaly'
              ? 'CONTRADICTION WITNESS SCAN'
              : 'IMMUTABLE MERKLE LATTICE'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 mono">
          REAL-TIME 3D HOLOGRAPHIC GEOMETRY • 60 FPS
        </p>
      </div>

      {/* Mode switcher pills (Skiper UI / Watermelon UI inspired) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
        <button
          onClick={() => setMode('smt')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'smt'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>SMT Core</span>
        </button>

        <button
          onClick={() => setMode('anomaly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'anomaly'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Contradiction</span>
        </button>

        <button
          onClick={() => setMode('lattice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'lattice'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Lattice</span>
        </button>
      </div>

      {/* Top right telemetry indicator */}
      <div className="absolute top-4 right-4 z-10 text-right pointer-events-none">
        <div className="text-[10px] text-cyan-400 mono font-semibold tracking-wider">
          CONSTRAINTS: ACTIVE
        </div>
        <div className="text-[9px] text-slate-500 mono mt-0.5">
          SOLVER RESIDUAL: {activeConflict ? 'INR 30,000.00' : 'INR 0.00'}
        </div>
      </div>
    </div>
  );
};
