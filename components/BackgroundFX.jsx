"use client";
import { useEffect, useRef } from "react";

// Animated luxury backdrop: slowly drifting gold particles with a soft glow,
// layered over the jewel-mesh gradient. Subtle, GPU-light, respects
// prefers-reduced-motion. Sits behind page content (z-0), above .phone bg.
export default function BackgroundFX() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf, w, h, dpr;
    const COUNT = 44;
    const particles = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.4, 2.4),
          vy: rand(0.05, 0.32),
          vx: rand(-0.12, 0.12),
          a: rand(0.12, 0.6),
          tw: rand(0.006, 0.022),
          ph: rand(0, Math.PI * 2),
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.ph += p.tw;
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 196, 106, ${alpha})`;
        ctx.shadowColor = "rgba(212, 175, 55, 0.85)";
        ctx.shadowBlur = p.r * 5;
        ctx.fill();
        if (!reduce) {
          p.y -= p.vy;
          p.x += p.vx;
          if (p.y < -6) { p.y = h + 6; p.x = rand(0, w); }
          if (p.x < -6) p.x = w + 6;
          else if (p.x > w + 6) p.x = -6;
        }
      }
      ctx.shadowBlur = 0;
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    const onResize = () => { resize(); init(); };
    resize();
    init();
    frame();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-phone pointer-events-none z-0"
    />
  );
}
