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

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090c, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Color definitions based on tokens
    const getColors = (m: 'smt' | 'anomaly' | 'lattice') => {
      if (m === 'anomaly') {
        return {
          primary: 0xff4d6a, // ruby
          secondary: 0xf5a524, // amber
          wire: 0xff8da0,
          glow: 0x9f1239,
        };
      }
      if (m === 'lattice') {
        return {
          primary: 0xc6f432, // lime
          secondary: 0x5ce1e6, // cyan
          wire: 0xc6f432,
          glow: 0x064e3b,
        };
      }
      // smt
      return {
        primary: 0x5ce1e6, // cyan
        secondary: 0x3a4757, // line-strong
        wire: 0x5ce1e6,
        glow: 0x1f2733,
      };
    };

    const colors = getColors(mode);

    // Central 3D Icosahedron
    const geoCore = new THREE.IcosahedronGeometry(1.2, 1);
    const matCore = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.4,
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

    // Orbital Torus Ring
    const geoRing = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
    const matRing = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.7,
    });
    const ringMesh1 = new THREE.Mesh(geoRing, matRing);
    ringMesh1.rotation.x = Math.PI / 3;
    mainGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(geoRing, matRing);
    ringMesh2.rotation.y = Math.PI / 4;
    ringMesh2.rotation.x = -Math.PI / 6;
    mainGroup.add(ringMesh2);

    // Particle Cloud
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }
    const geoParticles = new THREE.BufferGeometry();
    geoParticles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const matParticles = new THREE.PointsMaterial({
      size: 0.035,
      color: colors.primary,
      transparent: true,
      opacity: 0.8,
    });
    const particlesMesh = new THREE.Points(geoParticles, matParticles);
    mainGroup.add(particlesMesh);

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);

    const pointLight = new THREE.PointLight(colors.primary, 4, 15);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      coreMesh.rotation.y = elapsedTime * 0.25;
      coreMesh.rotation.x = elapsedTime * 0.15;
      wireMesh.rotation.y = -elapsedTime * 0.2;
      ringMesh1.rotation.z = elapsedTime * 0.3;
      ringMesh2.rotation.z = -elapsedTime * 0.25;
      particlesMesh.rotation.y = elapsedTime * 0.08;

      mainGroup.rotation.y += (mouseX * 0.6 - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (-mouseY * 0.4 - mainGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

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
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geoCore.dispose();
      matCore.dispose();
      geoWire.dispose();
      matWire.dispose();
      geoRing.dispose();
      matRing.dispose();
      geoParticles.dispose();
      matParticles.dispose();
    };
  }, [mode]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-ground rounded-panel border border-line overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top telemetry banner */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider text-cyan uppercase font-mono">
            {mode === 'smt'
              ? 'Z3 SMT THEOREM SOLVER CORE'
              : mode === 'anomaly'
              ? 'CONTRADICTION WITNESS SCAN'
              : 'IMMUTABLE MERKLE LATTICE'}
          </span>
        </div>
        <p className="text-[10px] text-dim mt-0.5 font-mono">
          REAL-TIME 3D HOLOGRAPHIC GEOMETRY · 60 FPS
        </p>
      </div>

      {/* Mode switcher pills */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 p-1 rounded-panel bg-panel/90 backdrop-blur border border-line shadow-xl font-mono text-xs">
        <button
          type="button"
          onClick={() => setMode('smt')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            mode === 'smt'
              ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-[0_0_12px_rgba(92,225,230,0.3)]'
              : 'text-dim hover:text-text'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>SMT Core</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('anomaly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            mode === 'anomaly'
              ? 'bg-ruby/20 text-ruby border border-ruby/40 shadow-[0_0_12px_rgba(255,77,106,0.3)]'
              : 'text-dim hover:text-text'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Contradiction</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('lattice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            mode === 'lattice'
              ? 'bg-lime/20 text-lime border border-lime/40 shadow-[0_0_12px_rgba(198,244,50,0.3)]'
              : 'text-dim hover:text-text'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Lattice</span>
        </button>
      </div>

      {/* Top right telemetry indicator */}
      <div className="absolute top-4 right-4 z-10 text-right pointer-events-none font-mono">
        <div className="text-[10px] text-cyan font-semibold tracking-wider">
          CONSTRAINTS: ACTIVE
        </div>
        <div className="text-[9px] text-dim mt-0.5">
          SOLVER RESIDUAL: {activeConflict ? '₹30,000' : '₹0'}
        </div>
      </div>
    </div>
  );
};
