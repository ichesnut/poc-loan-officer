"use client";

import { useEffect, useRef } from "react";

interface TesseractLogoProps {
  size?: number;
  className?: string;
}

// 4D tesseract vertices (unit hypercube centered at origin)
const VERTICES_4D = [
  [-1, -1, -1, -1],
  [1, -1, -1, -1],
  [1, 1, -1, -1],
  [-1, 1, -1, -1],
  [-1, -1, 1, -1],
  [1, -1, 1, -1],
  [1, 1, 1, -1],
  [-1, 1, 1, -1],
  [-1, -1, -1, 1],
  [1, -1, -1, 1],
  [1, 1, -1, 1],
  [-1, 1, -1, 1],
  [-1, -1, 1, 1],
  [1, -1, 1, 1],
  [1, 1, 1, 1],
  [-1, 1, 1, 1],
];

// Edges: connect vertices that differ in exactly one coordinate
const EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diff = 0;
    for (let k = 0; k < 4; k++) {
      if (VERTICES_4D[i][k] !== VERTICES_4D[j][k]) diff++;
    }
    if (diff === 1) EDGES.push([i, j]);
  }
}

function project4Dto2D(
  v: number[],
  angleXW: number,
  angleYW: number,
  angleZW: number
): [number, number, number] {
  // Rotate in XW plane
  let x = v[0] * Math.cos(angleXW) - v[3] * Math.sin(angleXW);
  let y = v[1];
  let z = v[2];
  let w = v[0] * Math.sin(angleXW) + v[3] * Math.cos(angleXW);

  // Rotate in YW plane
  const y2 = y * Math.cos(angleYW) - w * Math.sin(angleYW);
  const w2 = y * Math.sin(angleYW) + w * Math.cos(angleYW);
  y = y2;
  w = w2;

  // Rotate in ZW plane
  const z2 = z * Math.cos(angleZW) - w * Math.sin(angleZW);
  const w3 = z * Math.sin(angleZW) + w * Math.cos(angleZW);
  z = z2;
  w = w3;

  // Perspective projection from 4D to 3D
  const dist4 = 3;
  const scale4 = dist4 / (dist4 - w);

  const x3 = x * scale4;
  const y3 = y * scale4;
  const z3 = z * scale4;

  // Perspective projection from 3D to 2D
  const dist3 = 4;
  const scale3 = dist3 / (dist3 - z3);

  return [x3 * scale3, y3 * scale3, scale4 * scale3];
}

export function TesseractLogo({ size = 36, className = "" }: TesseractLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let startTime: number | null = null;

    function draw(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      const angleXW = elapsed * 0.3;
      const angleYW = elapsed * 0.2;
      const angleZW = elapsed * 0.15;

      ctx!.clearRect(0, 0, size, size);

      const half = size / 2;
      const scale = size * 0.18;

      // Project all vertices
      const projected = VERTICES_4D.map((v) =>
        project4Dto2D(v, angleXW, angleYW, angleZW)
      );

      // Get computed color from CSS
      const style = getComputedStyle(canvas!);
      const color = style.color || "#000";

      // Draw edges with depth-based opacity
      for (const [i, j] of EDGES) {
        const [x1, y1, s1] = projected[i];
        const [x2, y2, s2] = projected[j];
        const avgDepth = (s1 + s2) / 2;
        const opacity = Math.min(1, Math.max(0.15, avgDepth * 0.4));

        ctx!.beginPath();
        ctx!.moveTo(half + x1 * scale, half + y1 * scale);
        ctx!.lineTo(half + x2 * scale, half + y2 * scale);
        ctx!.strokeStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.lineWidth = Math.max(0.8, avgDepth * 0.7);
        ctx!.stroke();
      }

      // Draw vertices
      for (const [x, y, s] of projected) {
        const radius = Math.max(0.8, s * 0.9);
        const opacity = Math.min(1, Math.max(0.2, s * 0.5));

        ctx!.beginPath();
        ctx!.arc(half + x * scale, half + y * scale, radius, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, color: "inherit" }}
      aria-label="Tesseract Financial logo"
      role="img"
    />
  );
}
