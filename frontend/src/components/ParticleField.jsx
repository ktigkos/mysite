import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W = window.innerWidth, H = window.innerHeight;

    // ── Scene
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Particles
    const COUNT = 2200;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    const c1 = new THREE.Color('#7b2fff'); // violet
    const c2 = new THREE.Color('#2979ff'); // blue
    const c3 = new THREE.Color('#ff0080'); // magenta accent

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const r = Math.random();
      const c = r < 0.5 ? c1 : r < 0.85 ? c2 : c3;
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Grid plane (deep background)
    const gridHelper = new THREE.GridHelper(30, 40, 0x1a1035, 0x1a1035);
    gridHelper.position.y = -3.5;
    gridHelper.rotation.x = Math.PI * 0.04;
    scene.add(gridHelper);

    // ── Floating wireframe icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x7b2fff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(3.2, 0.5, -1);
    scene.add(ico);

    // Second smaller one
    const ico2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshBasicMaterial({ color: 0x2979ff, wireframe: true, transparent: true, opacity: 0.22 })
    );
    ico2.position.set(-3.5, -0.8, -0.5);
    scene.add(ico2);

    // ── Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    // ── Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animate
    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slowly drift particles
      particles.rotation.y = t * 0.018;
      particles.rotation.x = t * 0.007;

      // Mouse parallax on camera
      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Rotate wireframes
      ico.rotation.x  = t * 0.3;
      ico.rotation.y  = t * 0.5;
      ico2.rotation.x = -t * 0.4;
      ico2.rotation.z = t * 0.35;

      // Pulse grid
      gridHelper.position.y = -3.5 + Math.sin(t * 0.4) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.55 }}
    />
  );
}
