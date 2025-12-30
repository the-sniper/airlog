"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, FileText, Tag, Sparkles } from "lucide-react";

// Sample feedback items that cycle through
const feedbackExamples = [
  {
    text: "The login button is really hard to find on mobile...",
    category: "UX Issue",
    categoryColor: "rgb(168, 85, 247)",
    bgColor: "rgba(168, 85, 247, 0.15)",
  },
  {
    text: "App crashes when I try to upload a large file",
    category: "Bug",
    categoryColor: "rgb(239, 68, 68)",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
  {
    text: "Would be great to have dark mode support here",
    category: "Feature Request",
    categoryColor: "rgb(99, 102, 241)",
    bgColor: "rgba(99, 102, 241, 0.15)",
  },
  {
    text: "The page takes forever to load on slow connections",
    category: "Performance",
    categoryColor: "rgb(251, 191, 36)",
    bgColor: "rgba(251, 191, 36, 0.15)",
  },
];

// Animated Demo Card - shows the voice to insight flow
export function HeroDemo() {
  const [phase, setPhase] = useState<
    "idle" | "recording" | "transcribing" | "categorizing" | "complete"
  >("idle");
  const [transcribedText, setTranscribedText] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [collectedItems, setCollectedItems] = useState<typeof feedbackExamples>(
    []
  );
  const waveformRef = useRef<HTMLDivElement>(null);

  const example = feedbackExamples[currentExample];

  useEffect(() => {
    let timeInterval: NodeJS.Timeout;

    if (phase === "recording") {
      timeInterval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => clearInterval(timeInterval);
  }, [phase]);

  useEffect(() => {
    const runDemo = async () => {
      // Reset for new cycle
      setPhase("idle");
      setTranscribedText("");
      setShowCategory(false);

      await sleep(1200);

      // Start recording
      setPhase("recording");
      await sleep(2500);

      // Start transcribing
      setPhase("transcribing");

      // Type out text letter by letter
      const text = example.text;
      for (let i = 0; i <= text.length; i++) {
        setTranscribedText(text.substring(0, i));
        await sleep(35);
      }

      await sleep(400);

      // Categorize
      setPhase("categorizing");
      await sleep(600);
      setShowCategory(true);
      await sleep(200);
      setPhase("complete");

      // Add to collected items
      setCollectedItems((items) => {
        const newItems = [example, ...items].slice(0, 4);
        return newItems;
      });

      await sleep(2500);

      // Move to next example
      setCurrentExample((i) => (i + 1) % feedbackExamples.length);
    };

    runDemo();
  }, [currentExample]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto space-y-4">
      {/* Glow effect behind card */}
      <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/10 rounded-3xl blur-3xl opacity-60" />

      {/* Main demo card */}
      <div className="relative bg-[#0f0f18]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Mic with recording ring */}
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  phase === "recording"
                    ? "bg-red-500/20"
                    : phase === "transcribing"
                    ? "bg-emerald-500/20"
                    : phase === "categorizing" || phase === "complete"
                    ? "bg-purple-500/20"
                    : "bg-indigo-500/20"
                }`}
              >
                <Mic
                  className={`w-5 h-5 transition-colors duration-300 ${
                    phase === "recording"
                      ? "text-red-400"
                      : phase === "transcribing"
                      ? "text-emerald-400"
                      : phase === "categorizing" || phase === "complete"
                      ? "text-purple-400"
                      : "text-indigo-400"
                  }`}
                />
              </div>
              {/* Recording pulse ring */}
              {phase === "recording" && (
                <>
                  <div className="absolute inset-0 rounded-xl border-2 border-red-400/50 animate-ping" />
                  <div className="absolute inset-0 rounded-xl border border-red-400/30" />
                </>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">Voice Note</div>
              <div className="text-xs text-white/40 flex items-center gap-1.5">
                {phase === "idle" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    Ready to record
                  </>
                )}
                {phase === "recording" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Recording...
                  </>
                )}
                {phase === "transcribing" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Transcribing...
                  </>
                )}
                {phase === "categorizing" && (
                  <>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    AI analyzing...
                  </>
                )}
                {phase === "complete" && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Complete
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recording timer */}
          <div
            className={`text-xs font-mono transition-opacity duration-300 ${
              phase === "recording" ? "opacity-100 text-red-400" : "opacity-0"
            }`}
          >
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Waveform visualization */}
        <div
          ref={waveformRef}
          className="h-14 flex items-center justify-center gap-[3px] mb-5 px-2"
        >
          {Array.from({ length: 35 }).map((_, i) => {
            const baseHeight = Math.sin(i * 0.3) * 0.3 + 0.4;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  phase === "recording"
                    ? "bg-gradient-to-t from-red-500 to-red-300"
                    : phase === "transcribing"
                    ? "bg-gradient-to-t from-emerald-500/60 to-emerald-300/60"
                    : "bg-gradient-to-t from-indigo-500/40 to-indigo-300/40"
                }`}
                style={{
                  height:
                    phase === "recording"
                      ? `${
                          (Math.sin(Date.now() / 80 + i * 0.4) * 0.4 + 0.6) *
                          100
                        }%`
                      : `${baseHeight * 50}%`,
                  animation:
                    phase === "recording"
                      ? `waveBar 0.4s ease-in-out infinite ${i * 30}ms`
                      : "none",
                  opacity: phase === "idle" ? 0.4 : 1,
                }}
              />
            );
          })}
        </div>

        {/* Transcription area */}
        <div className="relative min-h-[70px] mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-start gap-3">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                phase === "transcribing" ||
                phase === "categorizing" ||
                phase === "complete"
                  ? "bg-emerald-500/20"
                  : "bg-white/5"
              }`}
            >
              <FileText
                className={`w-3.5 h-3.5 transition-colors duration-300 ${
                  phase === "transcribing" ||
                  phase === "categorizing" ||
                  phase === "complete"
                    ? "text-emerald-400"
                    : "text-white/30"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                Transcription
              </div>
              <div className="text-sm text-white/80 leading-relaxed">
                {transcribedText || (
                  <span className="text-white/20 italic">
                    Waiting for audio...
                  </span>
                )}
                {phase === "transcribing" &&
                  transcribedText.length < example.text.length && (
                    <span className="inline-block w-0.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse" />
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Category tag */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
            showCategory
              ? "opacity-100 translate-y-0 bg-white/[0.03] border border-white/5"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
              AI Classification
            </div>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: example.bgColor,
                color: example.categoryColor,
              }}
            >
              {example.category}
            </span>
          </div>
        </div>
      </div>

      {/* Collected feedback items - mini dashboard preview */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-t from-purple-500/10 to-transparent rounded-2xl blur-2xl opacity-40" />
        <div className="relative bg-[#0f0f18]/80 backdrop-blur-xl border border-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              Feedback collected
            </span>
            <span className="text-[10px] text-white/20">
              {collectedItems.length} items
            </span>
          </div>
          <div className="space-y-1.5">
            {collectedItems.length === 0 ? (
              <div className="text-xs text-white/20 italic py-2 text-center">
                Items will appear here...
              </div>
            ) : (
              collectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/[0.02] animate-fadeIn"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.categoryColor }}
                  />
                  <span className="text-xs text-white/50 truncate flex-1">
                    {item.text.substring(0, 35)}...
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: item.bgColor,
                      color: item.categoryColor,
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating accent elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

// Background canvas animation with flowing data nodes
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

    // Floating particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }
    const particles: Particle[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }

    // Data flow nodes
    interface Node {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      color: string;
      size: number;
      trail: { x: number; y: number }[];
    }
    const nodes: Node[] = [];

    let time = 0;
    let lastNodeSpawn = 0;

    const animate = () => {
      time += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle ambient background glows
      const topLeftGlow = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        canvas.width * 0.5
      );
      topLeftGlow.addColorStop(0, "rgba(99, 102, 241, 0.06)");
      topLeftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topLeftGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bottomRightGlow = ctx.createRadialGradient(
        canvas.width,
        canvas.height,
        0,
        canvas.width,
        canvas.height,
        canvas.width * 0.4
      );
      bottomRightGlow.addColorStop(0, "rgba(139, 92, 246, 0.05)");
      bottomRightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bottomRightGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn flowing nodes
      if (time - lastNodeSpawn > 1200 && nodes.length < 8) {
        const startSide = Math.random() > 0.5;
        const startX = startSide ? canvas.width * 0.1 : canvas.width * 0.4;
        const startY =
          canvas.height * 0.3 + Math.random() * canvas.height * 0.4;
        nodes.push({
          x: startX,
          y: startY,
          targetX: canvas.width * 0.85,
          targetY: canvas.height * 0.3 + Math.random() * canvas.height * 0.4,
          speed: 0.8 + Math.random() * 0.4,
          color: [
            "99, 102, 241",
            "139, 92, 246",
            "168, 85, 247",
            "34, 211, 238",
          ][Math.floor(Math.random() * 4)],
          size: Math.random() * 2 + 2,
          trail: [],
        });
        lastNodeSpawn = time;
      }

      // Update and draw nodes with trails
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = node.targetX - node.x;
        const dy = node.targetY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
          nodes.splice(i, 1);
          continue;
        }

        // Add to trail
        node.trail.push({ x: node.x, y: node.y });
        if (node.trail.length > 20) node.trail.shift();

        node.x += (dx / dist) * node.speed;
        node.y += (dy / dist) * node.speed;

        // Draw trail
        if (node.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(node.trail[0].x, node.trail[0].y);
          for (let j = 1; j < node.trail.length; j++) {
            ctx.lineTo(node.trail[j].x, node.trail[j].y);
          }
          ctx.strokeStyle = `rgba(${node.color}, ${0.15})`;
          ctx.lineWidth = node.size * 0.8;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Draw node
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.size * 2
        );
        gradient.addColorStop(0, `rgba(${node.color}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${node.color}, 0.3)`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw particles
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
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
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
      glow.addColorStop(0, "rgba(99, 102, 241, 0.06)");
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
