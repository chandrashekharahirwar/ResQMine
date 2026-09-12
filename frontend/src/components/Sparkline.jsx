import React, { useEffect, useRef } from 'react';

export default function Sparkline({ data = [], color = '#3ED598', width = 120, height = 32 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length < 2) {
      // Draw flat baseline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, height - 4);
      ctx.lineTo(width, height - 4);
      ctx.stroke();
      return;
    }

    const max = 1.0;
    const min = 0.0;
    const range = max - min || 1;
    const step = width / (data.length - 1);

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '44');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    data.forEach((val, i) => {
      const clamped = Math.max(0, Math.min(1, val));
      const x = i * step;
      const y = height - (clamped / range) * (height - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Stroke line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw active tip point
    const lastX = width;
    const lastVal = Math.max(0, Math.min(1, data[data.length - 1]));
    const lastY = height - (lastVal / range) * (height - 8) - 4;
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

  }, [data, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="inline-block"
    />
  );
}
