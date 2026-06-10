// FloralBackground.jsx

import React, { useEffect, useRef } from "react";

export default function FloralBackground(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame;

    const mouse = {
      x: width / 2,
      y: height / 2,
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.28;
        this.vy = (Math.random() - 0.5) * 0.28;
        this.radius = 1.5 + Math.random() * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          this.x -= dx * 0.0025;
          this.y -= dy * 0.0025;
        }

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(37,99,235,0.35)";
        ctx.fill();
      }
    }

    const nodes = Array.from({ length: 80 }, () => new Node());

    const drawGrid = () => {
      ctx.beginPath();

      for (let x = 0; x < width; x += 64) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      for (let y = 0; y < height; y += 64) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }

      ctx.strokeStyle = "rgba(15,23,42,0.035)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawConnections = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 125) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            ctx.strokeStyle = `rgba(37,99,235,${0.18 * (1 - distance / 125)})`;

            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const drawCircuitLines = () => {
      ctx.strokeStyle = "rgba(15,23,42,0.08)";
      ctx.lineWidth = 1;

      for (let i = 0; i < 18; i++) {
        const x = ((i * 173) % width) + 20;
        const y = ((i * 109) % height) + 20;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 42, y);
        ctx.lineTo(x + 42, y + 28);
        ctx.lineTo(x + 88, y + 28);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + 88, y + 28, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(37,99,235,0.22)";
        ctx.fill();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawGrid();
      drawCircuitLines();

      nodes.forEach((node) => node.update());
      drawConnections();
      nodes.forEach((node) => node.draw());

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
