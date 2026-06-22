"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export const ThreeLaptop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;
    
    // --- 1. Scene, Camera & Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050816, 0.015);
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 7.5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // --- 2. Dynamic Offscreen Screen Canvas ---
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 512;
    screenCanvas.height = 320;
    const ctx = screenCanvas.getContext("2d");
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    
    // Draw initial screen content
    const updateScreenCanvas = (time: number) => {
      if (!ctx) return;
      // Background
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
      
      // Cyber Grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < screenCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, screenCanvas.height);
        ctx.stroke();
      }
      for (let y = (time * 20) % gridSize; y < screenCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(screenCanvas.width, y);
        ctx.stroke();
      }
      
      // Animated circuit lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 160 + Math.sin(time * 2) * 30);
      ctx.lineTo(200, 160 + Math.sin(time * 2) * 30);
      ctx.lineTo(250, 100 + Math.cos(time * 2) * 20);
      ctx.lineTo(400, 100 + Math.cos(time * 2) * 20);
      ctx.stroke();
      
      // Text Glowing Shadow
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 15;
      
      // Futuristic Text
      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Mr_Laptop.lk", 256, 140);
      
      ctx.fillStyle = "#3b82f6";
      ctx.font = "14px monospace";
      ctx.fillText("SYSTEM STATUS: ONLINE", 256, 180);
      
      ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
      ctx.font = "10px monospace";
      ctx.fillText(`RTX STABLE | FPS: ${Math.floor(60 + Math.sin(time) * 2)} | CORE TEMP: 42°C`, 256, 210);
      
      // Reset shadows
      ctx.shadowBlur = 0;
      
      screenTexture.needsUpdate = true;
    };
    
    // --- 3. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    
    // Cyber blue/purple main lights
    const mainLight = new THREE.DirectionalLight(0x3b82f6, 1.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 15);
    cyanLight.position.set(-3, -1, 3);
    scene.add(cyanLight);
    
    const underGlow = new THREE.PointLight(0x8b5cf6, 4, 8);
    underGlow.position.set(0, -1.8, 0);
    scene.add(underGlow);
    
    // --- 4. Procedural Laptop Group ---
    const laptopGroup = new THREE.Group();
    laptopGroup.position.y = -0.5;
    scene.add(laptopGroup);
    
    // Materials
    const aluminumMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    
    const screenBackMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    
    const keyboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.6,
    });
    
    const emissiveScreenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
    });
    
    // Laptop Base (Chassis)
    const baseGeo = new THREE.BoxGeometry(3.6, 0.1, 2.4);
    const baseMesh = new THREE.Mesh(baseGeo, aluminumMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    laptopGroup.add(baseMesh);
    
    // Keyboard Deck Inset
    const kbGeo = new THREE.BoxGeometry(3.2, 0.02, 1.2);
    const kbMesh = new THREE.Mesh(kbGeo, keyboardMaterial);
    kbMesh.position.set(0, 0.051, -0.3);
    laptopGroup.add(kbMesh);
    
    // Trackpad Inset
    const padGeo = new THREE.BoxGeometry(0.8, 0.01, 0.6);
    const padMesh = new THREE.Mesh(padGeo, keyboardMaterial);
    padMesh.position.set(0, 0.051, 0.7);
    laptopGroup.add(padMesh);
    
    // Screen Hinge
    const hingeGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 16);
    const hingeMesh = new THREE.Mesh(hingeGeo, aluminumMaterial);
    hingeMesh.rotation.z = Math.PI / 2;
    hingeMesh.position.set(0, 0.05, -1.18);
    laptopGroup.add(hingeMesh);
    
    // Screen Lid Group (pivot at hinge)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.05, -1.18);
    laptopGroup.add(lidGroup);
    
    // Screen Panel
    const panelGeo = new THREE.BoxGeometry(3.6, 2.4, 0.08);
    const panelMesh = new THREE.Mesh(panelGeo, screenBackMaterial);
    panelMesh.position.set(0, 1.2, 0); // center offset relative to pivot
    panelMesh.castShadow = true;
    lidGroup.add(panelMesh);
    
    // Actual Screen Display
    const displayGeo = new THREE.PlaneGeometry(3.4, 2.2);
    const displayMesh = new THREE.Mesh(displayGeo, emissiveScreenMat);
    displayMesh.position.set(0, 1.2, 0.045); // offset forward from backing
    lidGroup.add(displayMesh);
    
    // Set screen tilt (open angle)
    lidGroup.rotation.x = THREE.MathUtils.degToRad(108);
    
    // --- 5. Floating Particles Background ---
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
      
      // Velocities
      velocities.push(
        (Math.random() - 0.5) * 0.01, // x
        (Math.random() + 0.1) * 0.008, // y (rising up)
        (Math.random() - 0.5) * 0.01  // z
      );
    }
    
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    
    // Glowing particle texture using a canvas helper
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const pCtx = particleCanvas.getContext("2d");
    if (pCtx) {
      const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(6, 182, 212, 1)");
      grad.addColorStop(1, "rgba(6, 182, 212, 0)");
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 16, 16);
    }
    
    const pTexture = new THREE.CanvasTexture(particleCanvas);
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particleSystem = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particleSystem);
    
    // --- 6. Mouse Cursor Target Interactivity ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Normalize to -1 to +1
      mouseX = (x / width) * 2 - 1;
      mouseY = -(y / height) * 2 + 1;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    // --- 7. Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      // Update screen texture canvas
      updateScreenCanvas(time);
      
      // Base rotation and floating idle animation
      laptopGroup.position.y = -0.5 + Math.sin(time * 1.5) * 0.12;
      laptopGroup.rotation.y = time * 0.05;
      
      // Interactive mouse follow lerp
      targetX = mouseX * 0.25;
      targetY = mouseY * 0.2;
      
      laptopGroup.rotation.y += (targetX - (laptopGroup.rotation.y % 1)) * 0.1;
      laptopGroup.rotation.x = THREE.MathUtils.lerp(laptopGroup.rotation.x, targetY, 0.1);
      
      // Dynamic shift of specular point light
      cyanLight.position.x = -3 + mouseX * 3;
      cyanLight.position.y = -1 + mouseY * 2;
      
      // Animate floating particles
      const positionsArr = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positionsArr[i * 3] += velocities[i * 3];
        positionsArr[i * 3 + 1] += velocities[i * 3 + 1];
        positionsArr[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Reset particles going too high
        if (positionsArr[i * 3 + 1] > 4) {
          positionsArr[i * 3 + 1] = -4;
          positionsArr[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // --- 8. Handle Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    window.addEventListener("resize", handleResize);
    
    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose WebGL resources
      scene.clear();
      baseGeo.dispose();
      kbGeo.dispose();
      padGeo.dispose();
      hingeGeo.dispose();
      panelGeo.dispose();
      displayGeo.dispose();
      aluminumMaterial.dispose();
      keyboardMaterial.dispose();
      screenBackMaterial.dispose();
      emissiveScreenMat.dispose();
      screenTexture.dispose();
      pTexture.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);
  
  return (
    <div className="relative w-full h-[320px] sm:h-[450px] overflow-hidden flex items-center justify-center">
      {/* Visual glowing ring backing the WebGL frame */}
      <div className="absolute w-[240px] h-[240px] sm:w-[380px] sm:h-[380px] rounded-full bg-gradient-to-r from-primary/10 via-accent/5 to-purple-500/10 blur-[60px] animate-pulse-light -z-10" />
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
