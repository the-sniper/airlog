"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, FileText, Tag, ArrowRight, Pause } from "lucide-react";

// Animated Demo Card - shows the voice to insight flow
export function HeroDemo() {
  const [phase, setPhase] = useState<
    "idle" | "recording" | "transcribing" | "categorizing" | "complete"
  >("idle");
  const [transcribedText, setTranscribedText] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  const fullText = "The login button is hard to find on mobile view...";
  const category = { label: "UX Issue", color: "rgb(168, 85, 247)" };

  useEffect(() => {
    // Generate waveform bars
    const bars: number[] = [];
    for (let i = 0; i < 40; i++) {
      bars.push(Math.random() * 0.8 + 0.2);
    }
    setWaveformBars(bars);
  }, []);

  useEffect(() => {
    const runDemo = async () => {
      // Reset
      setPhase("idle");
      setTranscribedText("");
      setShowCategory(false);

      await sleep(1500);

      // Start recording
      setPhase("recording");
      await sleep(3000);

      // Start transcribing
      setPhase("transcribing");

      // Type out text letter by letter
      for (let i = 0; i <= fullText.length; i++) {
        setTranscribedText(fullText.substring(0, i));
        await sleep(40);
      }

      await sleep(500);

      // Categorize
      setPhase("categorizing");
      await sleep(800);
      setShowCategory(true);
      await sleep(200);
      setPhase("complete");

      await sleep(4000);

      // Loop
      runDemo();
    };

    runDemo();

    return () => {};
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow effect behind card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-60" />

      {/* Main demo card */}
      <div className="relative bg-[#12121a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                phase === "recording" ? "bg-red-500/20" : "bg-indigo-500/20"
              }`}
            >
              {phase === "recording" ? (
                <Mic className="w-5 h-5 text-red-400 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">Voice Note</div>
              <div className="text-xs text-white/40">
                {phase === "idle" && "Tap to record"}
                {phase === "recording" && "Recording..."}
                {phase === "transcribing" && "Transcribing..."}
                {phase === "categorizing" && "AI analyzing..."}
                {phase === "complete" && "Complete"}
              </div>
            </div>
          </div>

          {/* Recording indicator */}
          {phase === "recording" && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-mono">0:03</span>
            </div>
          )}
        </div>

        {/* Waveform visualization */}
        <div className="h-16 flex items-center justify-center gap-[2px] mb-6">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                phase === "recording"
                  ? "bg-gradient-to-t from-red-500 to-red-300"
                  : "bg-gradient-to-t from-indigo-500/50 to-indigo-300/50"
              }`}
              style={{
                height:
                  phase === "recording"
                    ? `${
                        (Math.sin(Date.now() / 100 + i * 0.5) * 0.5 + 0.5) *
                        height *
                        100
                      }%`
                    : `${height * 30}%`,
                opacity: phase === "idle" ? 0.3 : 1,
                animation:
                  phase === "recording"
                    ? `waveform 0.5s ease-in-out infinite ${i * 0.05}s`
                    : "none",
              }}
            />
          ))}
        </div>

        {/* Transcription area */}
        <div className="relative min-h-[80px] mb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                phase === "transcribing" ||
                phase === "categorizing" ||
                phase === "complete"
                  ? "bg-emerald-500/20"
                  : "bg-white/5"
              }`}
            >
              <FileText
                className={`w-4 h-4 transition-colors duration-300 ${
                  phase === "transcribing" ||
                  phase === "categorizing" ||
                  phase === "complete"
                    ? "text-emerald-400"
                    : "text-white/30"
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-white/40 mb-1">Transcription</div>
              <div className="text-sm text-white/80 leading-relaxed min-h-[40px]">
                {transcribedText}
                {phase === "transcribing" &&
                  transcribedText.length < fullText.length && (
                    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Category tag */}
        <div
          className={`flex items-center gap-3 transition-all duration-500 ${
            showCategory
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/40 mb-1">AI Classification</div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              {category.label}
            </span>
          </div>
        </div>
      </div>

      {/* Floating accent elements */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
    </div>
  );
}

// Animated waveform effect
function AnimatedWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 100;

    let time = 0;

    const animate = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw animated waveform
      ctx.beginPath();
      ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
      ctx.lineWidth = 2;

      for (let x = 0; x < canvas.width; x++) {
        const y =
          canvas.height / 2 +
          Math.sin(x * 0.02 + time) * 15 +
          Math.sin(x * 0.05 + time * 1.5) * 10 +
          Math.sin(x * 0.01 + time * 0.5) * 20;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto opacity-60"
      style={{ maxWidth: "400px" }}
    />
  );
}

// Background canvas animation
export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Floating particles (subtle stars)
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }
    const particles: Particle[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    // Connection nodes (representing data flow)
    interface Node {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      color: string;
      size: number;
    }
    const nodes: Node[] = [];

    let time = 0;
    let lastNodeSpawn = 0;

    const animate = () => {
      time += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle ambient background glow
      const topLeftGlow = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        canvas.width * 0.6
      );
      topLeftGlow.addColorStop(0, "rgba(99, 102, 241, 0.08)");
      topLeftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topLeftGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bottomRightGlow = ctx.createRadialGradient(
        canvas.width,
        canvas.height,
        0,
        canvas.width,
        canvas.height,
        canvas.width * 0.5
      );
      bottomRightGlow.addColorStop(0, "rgba(139, 92, 246, 0.06)");
      bottomRightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bottomRightGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn flowing nodes occasionally
      if (time - lastNodeSpawn > 800 && nodes.length < 15) {
        const startX = Math.random() * canvas.width * 0.3;
        const startY = Math.random() * canvas.height;
        nodes.push({
          x: startX,
          y: startY,
          targetX: canvas.width * 0.7 + Math.random() * canvas.width * 0.3,
          targetY: Math.random() * canvas.height,
          speed: 1 + Math.random(),
          color: [
            "99, 102, 241",
            "139, 92, 246",
            "168, 85, 247",
            "34, 211, 238",
          ][Math.floor(Math.random() * 4)],
          size: Math.random() * 3 + 2,
        });
        lastNodeSpawn = time;
      }

      // Update and draw flowing nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = node.targetX - node.x;
        const dy = node.targetY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          nodes.splice(i, 1);
          continue;
        }

        node.x += (dx / dist) * node.speed;
        node.y += (dy / dist) * node.speed;

        // Draw node with trail
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.size * 3
        );
        gradient.addColorStop(0, `rgba(${node.color}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${node.color}, 0.2)`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw and update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = Math.sin(time * 0.002 + p.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(180, 180, 220, ${p.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export function TechStackScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }

    let time = 0;

    const animate = () => {
      time += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const glow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3
      );
      glow.addColorStop(0, "rgba(99, 102, 241, 0.08)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = Math.sin(time * 0.002 + p.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(160, 160, 200, ${p.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}

// Helper
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
