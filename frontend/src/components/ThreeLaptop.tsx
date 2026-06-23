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
    
    // Draw screen content with Liquid Retina MacBook aesthetics
    const updateScreenCanvas = (time: number) => {
      if (!ctx) return;
      
      // 1. Black outer bezel border
      ctx.fillStyle = "#0c0d10";
      ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
      
      // 2. Clip main content for rounded Liquid Retina screen corners
      const bezel = 14;
      ctx.save();
      ctx.beginPath();
      const r = 14; // corner radius
      const x = bezel;
      const y = bezel;
      const w = screenCanvas.width - bezel * 2;
      const h = screenCanvas.height - bezel * 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.clip();
      
      // Screen background
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
      
      // Custom futuristic neon wallpaper gradient
      const bgGrad = ctx.createRadialGradient(256, 160, 0, 256, 160, 240);
      bgGrad.addColorStop(0, "rgba(6, 182, 212, 0.18)");
      bgGrad.addColorStop(0.5, "rgba(59, 130, 246, 0.08)");
      bgGrad.addColorStop(1, "rgba(5, 8, 22, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
      
      // Cyber Grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let cx = 0; cx < screenCanvas.width; cx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, screenCanvas.height);
        ctx.stroke();
      }
      for (let cy = (time * 20) % gridSize; cy < screenCanvas.height; cy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(screenCanvas.width, cy);
        ctx.stroke();
      }
      
      // Animated circuit lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 160 + Math.sin(time * 2) * 30);
      ctx.lineTo(200, 160 + Math.sin(time * 2) * 30);
      ctx.lineTo(250, 100 + Math.cos(time * 2) * 20);
      ctx.lineTo(400, 100 + Math.cos(time * 2) * 20);
      ctx.stroke();
      
      // Animated Pulsating Glowing MR_LAPTOP.LK Text
      const textScale = 1 + Math.sin(time * 3) * 0.05;
      const textY = 130 + Math.sin(time * 3) * 4;
      
      ctx.shadowColor = `hsl(${(time * 60) % 360}, 90%, 60%)`; // Active color-shifting glow
      ctx.shadowBlur = 15 + Math.sin(time * 4) * 8;
      
      ctx.save();
      ctx.translate(256, textY);
      ctx.scale(textScale, textScale);
      
      ctx.fillStyle = "#ffffff"; // Bright high-contrast white fill
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MR_LAPTOP.LK", 0, 0);
      ctx.restore();
      
      // Reset shadows for details
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "14px monospace";
      ctx.fillText("MacBook Air M3 • macOS Sequoia", 256, 175);
      
      ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
      ctx.font = "10px monospace";
      ctx.fillText("8-Core CPU | 10-Core GPU | 16GB Unified Memory", 256, 205);
      
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 9px monospace";
      ctx.fillText("● SYSTEM ONLINE", 256, 235);
      
      ctx.restore(); // Restore rounded screen clipping path
      
      // 3. Apple Notch (drawn on top of upper bezel center)
      ctx.fillStyle = "#0c0d10";
      const notchW = 76;
      const notchH = 15;
      const notchX = screenCanvas.width / 2 - notchW / 2;
      const notchY = bezel;
      
      ctx.beginPath();
      ctx.moveTo(notchX, notchY);
      ctx.lineTo(notchX + notchW, notchY);
      ctx.quadraticCurveTo(notchX + notchW, notchY + notchH, notchX + notchW - 8, notchY + notchH);
      ctx.lineTo(notchX + 8, notchY + notchH);
      ctx.quadraticCurveTo(notchX, notchY + notchH, notchX, notchY);
      ctx.closePath();
      ctx.fill();
      
      // Camera green indicator dot
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(screenCanvas.width / 2 + 10, bezel + 6, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // Camera lens dot
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(screenCanvas.width / 2, bezel + 6, 2.2, 0, Math.PI * 2);
      ctx.fill();
      
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
    
    // Premium MacBook Space Gray materials
    const aluminumMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f535c, // Sleek Space Gray finish
      metalness: 0.9,
      roughness: 0.16,
    });
    
    const screenBackMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f535c,
      metalness: 0.9,
      roughness: 0.16,
    });
    
    const keyboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0e12, // Dark recessed tray color
      roughness: 0.7,
    });
    
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x16181d, // Matte black keyboard keycap colors
      roughness: 0.8,
    });
    
    const emissiveScreenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
    });
    
    // MacBook Air ultra-thin tapered base
    const baseGeo = new THREE.BoxGeometry(3.8, 0.08, 2.5);
    const posAttr = baseGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const z = posAttr.getZ(i);
      const y = posAttr.getY(i);
      if (z > 0) {
        // Front edge - tapered down to 0.015 total thickness
        posAttr.setY(i, y > 0 ? 0.0075 : -0.0075);
      } else {
        // Hinge back - 0.06 total thickness
        posAttr.setY(i, y > 0 ? 0.03 : -0.03);
      }
    }
    baseGeo.computeVertexNormals();
    
    const baseMesh = new THREE.Mesh(baseGeo, aluminumMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    laptopGroup.add(baseMesh);
    
    const deckTilt = -Math.atan(0.0225 / 2.5); // Tilt to lay flush on tapered base surface
    
    // Keyboard recess deck
    const kbGeo = new THREE.BoxGeometry(3.3, 0.01, 1.3);
    const kbMesh = new THREE.Mesh(kbGeo, keyboardMaterial);
    kbMesh.position.set(0, 0.022, -0.3);
    kbMesh.rotation.x = deckTilt;
    laptopGroup.add(kbMesh);
    
    // Large Apple trackpad
    const padGeo = new THREE.BoxGeometry(1.0, 0.005, 0.7);
    const padMesh = new THREE.Mesh(padGeo, keyboardMaterial);
    padMesh.position.set(0, 0.013, 0.75);
    padMesh.rotation.x = deckTilt;
    laptopGroup.add(padMesh);
    
    // 3D keycap rows for real depth and specularity shadow effects
    const rowZ = [-0.85, -0.65, -0.45, -0.25, -0.05, 0.15];
    const keyRowGeo = new THREE.BoxGeometry(3.1, 0.012, 0.09);
    rowZ.forEach((zVal) => {
      const keyRow = new THREE.Mesh(keyRowGeo, keyMat);
      const yVal = 0.0075 - (zVal - 1.25) * 0.009 + 0.02; // Elevated key position
      keyRow.position.set(0, yVal, zVal);
      keyRow.rotation.x = deckTilt;
      laptopGroup.add(keyRow);
    });
    
    // Sleek thinned MacBook hinge
    const hingeGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 16);
    const hingeMesh = new THREE.Mesh(hingeGeo, aluminumMaterial);
    hingeMesh.rotation.z = Math.PI / 2;
    hingeMesh.position.set(0, 0.025, -1.23);
    laptopGroup.add(hingeMesh);
    
    // Screen Lid Group (pivot at hinge axis)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.025, -1.23);
    laptopGroup.add(lidGroup);
    
    // Screen Back Panel (Ultra-thin Apple lid)
    const panelGeo = new THREE.BoxGeometry(3.8, 2.5, 0.035);
    const panelMesh = new THREE.Mesh(panelGeo, screenBackMaterial);
    panelMesh.position.set(0, 1.25, 0); // Center offset relative to pivot axis
    panelMesh.castShadow = true;
    lidGroup.add(panelMesh);
    
    // Liquid Retina display panel mesh
    const displayGeo = new THREE.PlaneGeometry(3.64, 2.34);
    const displayMesh = new THREE.Mesh(displayGeo, emissiveScreenMat);
    displayMesh.position.set(0, 1.25, 0.018); // Position slightly forward from the panel center
    lidGroup.add(displayMesh);
    
    // Apple Logo Canvas (creates a glowing Apple silhouette on a transparent background)
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = 128;
    logoCanvas.height = 128;
    const lCtx = logoCanvas.getContext("2d");
    if (lCtx) {
      lCtx.fillStyle = "rgba(0,0,0,0)"; // fully transparent
      lCtx.fillRect(0, 0, 128, 128);
      
      // Draw Apple silhouette
      lCtx.fillStyle = "#ffffff";
      // leaf
      lCtx.beginPath();
      lCtx.moveTo(64, 30);
      lCtx.quadraticCurveTo(72, 30, 76, 16);
      lCtx.quadraticCurveTo(64, 16, 60, 26);
      lCtx.quadraticCurveTo(60, 30, 64, 30);
      lCtx.fill();
      
      // main apple body
      lCtx.beginPath();
      lCtx.moveTo(64, 43);
      lCtx.bezierCurveTo(56, 40, 36, 46, 36, 72);
      lCtx.bezierCurveTo(36, 94, 50, 112, 60, 112);
      lCtx.bezierCurveTo(64, 112, 64, 109, 68, 109);
      lCtx.bezierCurveTo(72, 109, 72, 112, 76, 112);
      lCtx.bezierCurveTo(86, 112, 100, 94, 100, 72);
      lCtx.bezierCurveTo(100, 46, 80, 40, 72, 43);
      lCtx.bezierCurveTo(68, 44, 68, 43, 64, 43);
      lCtx.fill();
      
      // Apple bite cutout mask
      lCtx.globalCompositeOperation = "destination-out";
      lCtx.beginPath();
      lCtx.arc(96, 66, 15, 0, Math.PI * 2);
      lCtx.fill();
    }
    
    const logoTexture = new THREE.CanvasTexture(logoCanvas);
    const logoMaterial = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    // Glowing Apple Logo centered on the back of the lid mesh
    const logoGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const logoMesh = new THREE.Mesh(logoGeo, logoMaterial);
    logoMesh.position.set(0, 1.25, -0.019); // Place flush on back
    logoMesh.rotation.y = Math.PI; // Orient outwards from back lid
    lidGroup.add(logoMesh);
    
    // Set screen tilt open angle (exactly 90 degrees layout)
    lidGroup.rotation.x = THREE.MathUtils.degToRad(90);
    
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
      
      // Base floating idle elevation animation
      laptopGroup.position.y = -0.5 + Math.sin(time * 1.5) * 0.12;
      
      // Interactive mouse follow 3D roll (rolls, pitches, and turns in alignment with cursor)
      const targetRotationY = mouseX * 0.7;   // Yaw
      const targetRotationX = mouseY * 0.45;  // Pitch
      const targetRotationZ = -mouseX * 0.35; // Z-axis Roll
      
      const idleSpin = time * 0.04;
      laptopGroup.rotation.y = THREE.MathUtils.lerp(laptopGroup.rotation.y, idleSpin + targetRotationY, 0.08);
      laptopGroup.rotation.x = THREE.MathUtils.lerp(laptopGroup.rotation.x, targetRotationX, 0.08);
      laptopGroup.rotation.z = THREE.MathUtils.lerp(laptopGroup.rotation.z, targetRotationZ, 0.08);
      
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
      keyRowGeo.dispose();
      hingeGeo.dispose();
      panelGeo.dispose();
      displayGeo.dispose();
      logoGeo.dispose();
      aluminumMaterial.dispose();
      keyboardMaterial.dispose();
      keyMat.dispose();
      screenBackMaterial.dispose();
      emissiveScreenMat.dispose();
      logoMaterial.dispose();
      screenTexture.dispose();
      logoTexture.dispose();
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
