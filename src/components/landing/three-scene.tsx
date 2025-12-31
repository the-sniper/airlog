"use client";

import { useEffect, useState, useRef } from "react";
import {
  Mic,
  FileText,
  Tag,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";

// Sample feedback items that cycle through
const feedbackExamples = [
  {
    text: "The login button is really hard to find on mobile...",
    category: "UX Issue",
    categoryColor: "rgb(20, 184, 166)", // teal-500
    bgColor: "rgba(20, 184, 166, 0.15)",
    confidence: 94,
  },
  {
    text: "App crashes when I try to upload a large file",
    category: "Bug",
    categoryColor: "rgb(239, 68, 68)", // red-500
    bgColor: "rgba(239, 68, 68, 0.15)",
    confidence: 98,
  },
  {
    text: "Would be great to have dark mode support here",
    category: "Feature",
    categoryColor: "rgb(139, 92, 246)", // violet-500
    bgColor: "rgba(139, 92, 246, 0.15)",
    confidence: 91,
  },
  {
    text: "The page takes forever to load on slow connections",
    category: "Performance",
    categoryColor: "rgb(234, 179, 8)", // yellow-500
    bgColor: "rgba(234, 179, 8, 0.15)",
    confidence: 96,
  },
];

// Premium Demo Card - with subtle gradient and fixed waveform
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
  const [confidenceAnim, setConfidenceAnim] = useState(0);
  const [tick, setTick] = useState(0);

  const example = feedbackExamples[currentExample];

  // Animate waveform by incrementing tick
  useEffect(() => {
    if (phase !== "recording") return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60);

    return () => clearInterval(interval);
  }, [phase]);

  // Generate waveform heights based on tick and phase
  const getWaveHeight = (index: number): number => {
    if (phase === "recording") {
      return Math.sin(tick * 0.15 + index * 0.4) * 0.35 + 0.5;
    }
    return Math.sin(index * 0.25) * 0.2 + 0.35;
  };

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

  // Animate confidence score
  useEffect(() => {
    if (showCategory) {
      let current = 0;
      const target = example.confidence;
      const interval = setInterval(() => {
        current += 3;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setConfidenceAnim(current);
      }, 20);
      return () => clearInterval(interval);
    } else {
      setConfidenceAnim(0);
    }
  }, [showCategory, example.confidence]);

  useEffect(() => {
    const runDemo = async () => {
      setPhase("idle");
      setTranscribedText("");
      setShowCategory(false);

      await sleep(1200);

      setPhase("recording");
      await sleep(2500);

      setPhase("transcribing");

      const text = example.text;
      for (let i = 0; i <= text.length; i++) {
        setTranscribedText(text.substring(0, i));
        await sleep(30);
      }

      await sleep(400);

      setPhase("categorizing");
      await sleep(600);
      setShowCategory(true);
      await sleep(200);
      setPhase("complete");

      setCollectedItems((items) => {
        const newItems = [example, ...items].slice(0, 4);
        return newItems;
      });

      await sleep(2500);

      setCurrentExample((i) => (i + 1) % feedbackExamples.length);
    };

    runDemo();
  }, [currentExample]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate category stats
  const categoryStats = collectedItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        {/* Subtle gradient border */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-teal-500/15 rounded-2xl blur-sm" />
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl" />

        {/* Main demo card */}
        <div className="relative bg-slate-100 dark:bg-[#0a0a12] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
          {/* Window chrome / title bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-3 text-xs text-slate-500 dark:text-white/40 font-medium">
                AirLog Recording
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-white/30">
              <span className="flex items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    phase === "recording"
                      ? "bg-red-500 animate-pulse"
                      : "bg-emerald-500"
                  }`}
                />
                {phase === "recording" ? "Live" : "Ready"}
              </span>
            </div>
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Mic with recording ring */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                      phase === "recording"
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30"
                        : phase === "transcribing"
                        ? "bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30"
                        : phase === "categorizing" || phase === "complete"
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/30"
                        : "bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30"
                    }`}
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  {/* Recording pulse rings */}
                  {phase === "recording" && (
                    <>
                      <div className="absolute inset-0 rounded-xl border-2 border-red-400/60 animate-ping" />
                      <div className="absolute -inset-1 rounded-xl border border-red-400/20 animate-pulse" />
                    </>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Voice Note
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                    {phase === "idle" && "Tap to start recording"}
                    {phase === "recording" && (
                      <span className="flex items-center gap-1 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Recording audio...
                      </span>
                    )}
                    {phase === "transcribing" && (
                      <span className="flex items-center gap-1 text-violet-400">
                        <Sparkles className="w-3 h-3" />
                        AI transcribing...
                      </span>
                    )}
                    {phase === "categorizing" && (
                      <span className="flex items-center gap-1 text-teal-400">
                        <Sparkles className="w-3 h-3 animate-spin" />
                        Analyzing content...
                      </span>
                    )}
                    {phase === "complete" && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Processing complete
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recording timer */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                  phase === "recording"
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${
                    phase === "recording"
                      ? "text-red-400"
                      : "text-slate-400 dark:text-white/30"
                  }`}
                />
                <span
                  className={`text-xs font-mono ${
                    phase === "recording"
                      ? "text-red-400"
                      : "text-slate-400 dark:text-white/30"
                  }`}
                >
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>

            {/* Waveform visualization */}
            <div className="relative h-16 mb-5 rounded-xl bg-gradient-to-b from-slate-200/50 dark:from-white/[0.03] to-transparent border border-slate-200 dark:border-white/5 overflow-hidden">
              {/* Waveform bars - full width */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                {Array.from({ length: 60 }).map((_, i) => {
                  const height = getWaveHeight(i);
                  return (
                    <div
                      key={i}
                      className={`flex-1 mx-[1px] rounded-full transition-all duration-100 ${
                        phase === "recording"
                          ? "bg-gradient-to-t from-red-500 to-red-300"
                          : phase === "transcribing"
                          ? "bg-gradient-to-t from-violet-500/70 to-violet-300/70"
                          : "bg-gradient-to-t from-violet-500/30 to-violet-300/30"
                      }`}
                      style={{
                        height: `${Math.max(4, height * 52)}px`,
                        opacity: phase === "idle" ? 0.4 : 1,
                      }}
                    />
                  );
                })}
              </div>
              {/* Center line */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent" />
            </div>

            {/* Transcription area with premium styling */}
            <div className="relative mb-4 p-4 rounded-xl bg-gradient-to-br from-white dark:from-white/[0.05] to-slate-50 dark:to-white/[0.02] border border-slate-200 dark:border-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    phase === "transcribing" ||
                    phase === "categorizing" ||
                    phase === "complete"
                      ? "bg-violet-500/20 border border-violet-500/20"
                      : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 transition-colors duration-300 ${
                      phase === "transcribing" ||
                      phase === "categorizing" ||
                      phase === "complete"
                        ? "text-violet-400"
                        : "text-slate-400 dark:text-white/30"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5 font-medium">
                    Transcription
                  </div>
                  <div className="text-sm text-slate-900 dark:text-white/90 leading-relaxed min-h-[44px]">
                    {transcribedText || (
                      <span className="text-slate-400 dark:text-white/25 italic">
                        Waiting for audio input...
                      </span>
                    )}
                    {phase === "transcribing" &&
                      transcribedText.length < example.text.length && (
                        <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse" />
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Classification with confidence score */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-500 border ${
                showCategory
                  ? "opacity-100 translate-y-0 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20"
                  : "opacity-0 translate-y-2 bg-transparent border-transparent"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/40 font-medium">
                    AI Classification
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-teal-500 dark:text-teal-400">
                    <Zap className="w-3 h-3" />
                    {confidenceAnim}% confidence
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg"
                    style={{
                      backgroundColor: example.bgColor,
                      color: example.categoryColor,
                      boxShadow: `0 4px 12px ${example.bgColor}`,
                    }}
                  >
                    {example.category}
                  </span>
                  {/* Confidence bar */}
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-700"
                      style={{ width: `${confidenceAnim}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced mini-dashboard */}
      <div className="relative mt-4">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-teal-500/15 rounded-xl blur-sm" />
        <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl" />

        <div className="relative bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
          {/* Dashboard header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-white/70">
                Session Analytics
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-white/30 font-mono">
              {collectedItems.length} items
            </span>
          </div>

          {/* Category distribution mini-chart */}
          {collectedItems.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1 h-2">
                {Object.entries(categoryStats).map(([cat]) => {
                  const item = feedbackExamples.find((e) => e.category === cat);
                  const count = categoryStats[cat];
                  const width = (count / collectedItems.length) * 100;
                  return (
                    <div
                      key={cat}
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: item?.categoryColor,
                        opacity: 0.8,
                      }}
                      title={`${cat}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {Object.entries(categoryStats).map(([cat, count]) => {
                  const item = feedbackExamples.find((e) => e.category === cat);
                  return (
                    <div key={cat} className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item?.categoryColor }}
                      />
                      <span className="text-[10px] text-slate-500 dark:text-white/40">
                        {cat.split(" ")[0]}
                      </span>
                      <span className="text-[10px] text-slate-700 dark:text-white/60 font-medium">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collected items list */}
          <div className="p-3 space-y-1.5 max-h-[140px] overflow-hidden">
            {collectedItems.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-white/25 italic py-4 text-center">
                Recording feedback will appear here...
              </div>
            ) : (
              collectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors animate-fadeIn group"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: item.categoryColor,
                      boxShadow: `0 0 0 2px ${item.categoryColor}30`,
                    }}
                  />
                  <span className="text-xs text-slate-600 dark:text-white/60 truncate flex-1 group-hover:text-slate-900 dark:group-hover:text-white/80 transition-colors">
                    {item.text.substring(0, 40)}...
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0"
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
    </div>
  );
}

// Animated "How it Works" Section
export function HowItWorksAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  const steps = [
    {
      icon: Mic,
      title: "Record",
      description: "Speak naturally while testing",
      activeColor: "text-red-400",
      activeBg: "bg-red-500/10",
      activeBorder: "border-red-500/20",
    },
    {
      icon: Sparkles,
      title: "Transcribe",
      description: "AI converts speech to text",
      activeColor: "text-violet-400",
      activeBg: "bg-violet-500/10",
      activeBorder: "border-violet-500/20",
    },
    {
      icon: Tag,
      title: "Classify",
      description: "Smart categorization by type",
      activeColor: "text-teal-400",
      activeBg: "bg-teal-500/10",
      activeBorder: "border-teal-500/20",
    },
    {
      icon: TrendingUp,
      title: "Analyze",
      description: "Get actionable insights",
      activeColor: "text-teal-400",
      activeBg: "bg-teal-500/10",
      activeBorder: "border-teal-500/20",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {steps.map((step, idx) => {
        const isActive = activeStep === idx;
        const Icon = step.icon;

        return (
          <div
            key={idx}
            className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              isActive
                ? `${step.activeBg} ${step.activeBorder}`
                : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            }`}
            onClick={() => setActiveStep(idx)}
          >
            <div
              className={`absolute top-3 right-3 text-[10px] font-mono ${
                isActive
                  ? "text-slate-400 dark:text-white/50"
                  : "text-slate-300 dark:text-white/20"
              }`}
            >
              0{idx + 1}
            </div>

            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                isActive ? step.activeBg : "bg-slate-200 dark:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? step.activeColor
                    : "text-slate-400 dark:text-white/40"
                }`}
              />
            </div>

            <h3
              className={`text-base font-semibold mb-1 ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-white/60"
              }`}
            >
              {step.title}
            </h3>
            <p
              className={`text-sm ${
                isActive
                  ? "text-slate-600 dark:text-white/60"
                  : "text-slate-400 dark:text-white/40"
              }`}
            >
              {step.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Stats - Always visible values
export function AnimatedStats() {
  const stats = [
    {
      value: "5×",
      label: "Faster than typing",
      sublabel: "150 WPM voice vs 40 WPM typing",
    },
    {
      value: "95%",
      label: "Classification accuracy",
      sublabel: "AI-powered categorization",
    },
    {
      value: "<2s",
      label: "Transcription latency",
      sublabel: "Near-instant results",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-6 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-teal-500/20 transition-colors"
        >
          <div className="text-4xl font-bold text-teal-500 dark:text-teal-400 mb-2">
            {stat.value}
          </div>
          <div className="text-base font-medium text-slate-700 dark:text-white/80 mb-1">
            {stat.label}
          </div>
          <div className="text-sm text-slate-500 dark:text-white/40">
            {stat.sublabel}
          </div>
        </div>
      ))}
    </div>
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

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }
    const particles: Particle[] = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.25 + 0.08,
      });
    }

    let time = 0;

    const animate = () => {
      time += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle corner glows - indigo only
      const topLeftGlow = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        canvas.width * 0.4
      );
      topLeftGlow.addColorStop(0, "rgba(20, 184, 166, 0.03)");
      topLeftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topLeftGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bottomRightGlow = ctx.createRadialGradient(
        canvas.width,
        canvas.height,
        0,
        canvas.width,
        canvas.height,
        canvas.width * 0.35
      );
      bottomRightGlow.addColorStop(0, "rgba(20, 184, 166, 0.025)");
      bottomRightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bottomRightGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = Math.sin(time * 0.002 + p.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(160, 165, 200, ${p.alpha * twinkle})`;
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
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.2 + 0.05,
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
        canvas.width * 0.25
      );
      glow.addColorStop(0, "rgba(99, 102, 241, 0.03)");
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
        ctx.fillStyle = `rgba(150, 155, 190, ${p.alpha * twinkle})`;
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
        opacity: 0.5,
      }}
    />
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
