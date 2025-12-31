import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  Mic,
  Brain,
  BarChart3,
  Users,
  FileText,
  Folder,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Play,
  ChevronDown,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-auth";
import dynamic from "next/dynamic";

// Dynamically import Three.js components to avoid SSR issues
const HeroScene = dynamic(
  () => import("@/components/landing/three-scene").then((mod) => mod.HeroScene),
  { ssr: false }
);

const HeroDemo = dynamic(
  () => import("@/components/landing/three-scene").then((mod) => mod.HeroDemo),
  { ssr: false }
);

const HowItWorksAnimation = dynamic(
  () =>
    import("@/components/landing/three-scene").then(
      (mod) => mod.HowItWorksAnimation
    ),
  { ssr: false }
);

const AnimatedStats = dynamic(
  () =>
    import("@/components/landing/three-scene").then((mod) => mod.AnimatedStats),
  { ssr: false }
);

const TechStackScene = dynamic(
  () =>
    import("@/components/landing/three-scene").then(
      (mod) => mod.TechStackScene
    ),
  { ssr: false }
);

export default async function Home() {
  // Check if user is logged in as admin
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  // Check if user is logged in as a regular user
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-300">
      {/* Plus/Cross pattern for entire landing page */}
      <div
        className="fixed inset-0 -z-30 opacity-[0.05] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364748b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Flowing aurora gradient overlays */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        {/* Primary teal aurora */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-[150px] animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
            animationDuration: "8s",
          }}
        />
        {/* Cyan mid-section glow */}
        <div
          className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
            animationDuration: "10s",
            animationDelay: "2s",
          }}
        />
        {/* Emerald bottom glow */}
        <div
          className="absolute -bottom-1/4 left-1/3 w-[700px] h-[700px] rounded-full blur-[130px] animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)",
            animationDuration: "12s",
            animationDelay: "4s",
          }}
        />
        {/* Accent orb */}
        <div
          className="absolute top-2/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/20 border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={110}
                height={28}
                priority
                className="dark:block hidden"
              />
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={110}
                height={28}
                priority
                className="dark:hidden block"
              />
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 dark:text-white/60">
              <a
                href="#features"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#technology"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Technology
              </a>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                asChild
                variant="ghost"
                className="hidden sm:flex text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-medium border-0"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Dense dotted pattern - Hero only */}
        <div
          className="absolute inset-0 z-[1] opacity-[0.12] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1.5px, transparent 0)`,
            backgroundSize: "16px 16px",
          }}
        />

        {/* Canvas animation - positioned absolutely within section */}
        <HeroScene />

        {/* Content - above canvas */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Text content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-white/80 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Voice-First Testing Platform
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-slate-900 dark:text-white">
                  Capture feedback
                </span>
                <br />
                <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  at the speed of thought
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 dark:text-white/50 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Stop writing. Start talking. Transform voice recordings into
                actionable insights with AI-powered transcription and
                classification.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 border-0 shadow-lg shadow-teal-500/20"
                >
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base bg-transparent border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30"
                >
                  <Link href="/login" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 pt-4 text-sm text-slate-500 dark:text-white/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>
            </div>

            {/* Right side - Animated Demo */}
            <div className="relative lg:pl-8">
              <HeroDemo />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-slate-400 dark:text-white/30" />
        </div>

        {/* Bottom fade for smooth transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-slate-50 dark:to-[#0f1419] pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 lg:py-40">
        {/* Grid line pattern with top fade */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to bottom, transparent, black 150px)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 150px)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need.
              <br />
              <span className="text-slate-400 dark:text-white/40">
                Nothing you don&apos;t.
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-white/50">
              A complete toolkit for product teams who want fast, organized, and
              actionable feedback.
            </p>
          </div>

          {/* Feature Cards - Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Voice Recording - Large */}
            <div className="lg:col-span-2 group relative p-6 lg:p-10 rounded-3xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-teal-500/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-teal-500/10 mb-6">
                  <Mic className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Voice Recording</h3>
                <p className="text-slate-600 dark:text-white/50 text-lg leading-relaxed max-w-md">
                  One-click audio capture with pause/resume. Record feedback
                  naturally while testing—5× faster than typing detailed notes.
                </p>
              </div>
            </div>

            {/* AI Classification */}
            <div className="group relative p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-teal-500/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-teal-500/10 mb-6">
                  <Brain className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  AI Classification
                </h3>
                <p className="text-slate-600 dark:text-white/50 leading-relaxed">
                  Automatically categorize feedback as Bug, Feature, UX, or
                  Performance with 95% accuracy.
                </p>
              </div>
            </div>

            {/* Analytics */}
            <div className="group relative p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 mb-6">
                  <BarChart3 className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  Real-time Analytics
                </h3>
                <p className="text-slate-600 dark:text-white/50 leading-relaxed">
                  Live dashboards with category breakdowns, trends, and
                  actionable insights.
                </p>
              </div>
            </div>

            {/* Team Management */}
            <div className="group relative p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 mb-6">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Team Management</h3>
                <p className="text-slate-600 dark:text-white/50 leading-relaxed">
                  Create teams, bulk invite testers, and track participation
                  across sessions.
                </p>
              </div>
            </div>

            {/* Reports */}
            <div className="group relative p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 mb-6">
                  <FileText className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">PDF Reports</h3>
                <p className="text-slate-600 dark:text-white/50 leading-relaxed">
                  Generate professional reports with AI summaries. Share via
                  email or public link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Animated */}
      <section id="how-it-works" className="relative py-16 lg:py-32">
        {/* Grid line pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Four steps to
              <br />
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                better feedback
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-white/50">
              From voice to actionable insights in seconds
            </p>
          </div>

          <div className="relative">
            <HowItWorksAnimation />
          </div>
        </div>
      </section>

      {/* Stats Section - Animated counters */}
      <section className="relative py-16 lg:py-32">
        {/* Fine grid line pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                speed and accuracy
              </span>
            </h2>
            <p className="text-slate-600 dark:text-white/50">
              Real metrics, real results
            </p>
          </div>
          <AnimatedStats />
        </div>
      </section>

      {/* Technology Section */}
      <section
        id="technology"
        className="relative py-16 lg:py-40 overflow-hidden"
      >
        {/* Grid line pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        <TechStackScene />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built on
              <br />
              <span className="text-slate-400 dark:text-white/40">
                proven technology
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-white/50">
              Real engineering. Real numbers. No marketing fluff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {[
              {
                value: "5×",
                label: "Faster Data Entry",
                detail:
                  "Voice at 150 WPM vs typing at 40 WPM. Real-time transcription captures your thoughts while maintaining context.",
                icon: Mic,
              },
              {
                value: "95%",
                label: "Classification Accuracy",
                detail:
                  "LLM-powered classification with deterministic inference. Keyword fallback ensures reliability.",
                icon: Brain,
              },
              {
                value: "<2s",
                label: "Transcription Latency",
                detail:
                  "Self-hosted speech recognition for privacy and speed. Your recordings never leave your control.",
                icon: Zap,
              },
              {
                value: "∞",
                label: "Unlimited Scale",
                detail:
                  "Enterprise-grade Postgres with row-level security. Sessions and recordings scale seamlessly.",
                icon: Folder,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-start gap-4 lg:gap-6 p-4 lg:p-6"
              >
                <div className="shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center border border-slate-200 dark:border-white/10">
                    <stat.icon className="w-6 h-6 text-teal-500" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-baseline gap-1 lg:gap-3 mb-2">
                    <span
                      className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
                      style={stat.value === "∞" ? { fontSize: "2.5rem" } : {}}
                    >
                      {stat.value}
                    </span>
                    <span className="text-base lg:text-lg font-medium">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-white/50 leading-relaxed">
                    {stat.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 lg:py-40">
        {/* Grid line pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          <div className="relative rounded-3xl lg:rounded-[2.5rem] bg-gradient-to-br from-teal-500/10 dark:from-teal-600/15 via-cyan-500/5 dark:via-cyan-600/8 to-transparent border border-slate-200 dark:border-white/10 p-8 lg:p-20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-400/15 dark:bg-teal-600/20 rounded-full blur-[120px]" />

            <div className="relative max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to transform
                <br />
                your user testing?
              </h2>
              <p className="text-xl text-slate-600 dark:text-white/50 mb-10">
                Join product teams who capture feedback faster and ship better
                products. Free plan available.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-white/90 font-medium"
                >
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base bg-transparent border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Link href="/admin/login" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Admin Login
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={80}
                height={20}
                className="opacity-50 dark:block hidden"
              />
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={80}
                height={20}
                className="opacity-50 dark:hidden block"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-white/30">
              © {new Date().getFullYear()} AirLog. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
