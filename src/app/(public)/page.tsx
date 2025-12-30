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
  Timer,
  Target,
  Bug,
  Lightbulb,
  Gauge,
  Play,
  UserPlus,
  ClipboardList,
  PieChart,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-auth";

const features = [
  {
    icon: Mic,
    title: "Voice Recording",
    description:
      "One-click audio capture with pause/resume. 5x faster than typing.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Brain,
    title: "AI Classification",
    description:
      "Auto-categorize feedback as Bug, Feature, UX, or Performance.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Live dashboards, leaderboards, and category breakdowns.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Organize testers into teams. Bulk invites with one click.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description: "Professional reports with AI summaries. Share via email.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Folder,
    title: "Session Control",
    description: "Create scenes, track progress, and manage session lifecycle.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "Create Session",
    description:
      "Define your test with scenes, descriptions, and build versions.",
  },
  {
    icon: UserPlus,
    title: "Invite Testers",
    description: "Add individuals or entire teams with shareable join codes.",
  },
  {
    icon: Play,
    title: "Record Feedback",
    description: "Testers capture voice notes while testing your product.",
  },
  {
    icon: PieChart,
    title: "Analyze Results",
    description: "Review AI-categorized feedback and generate reports.",
  },
];

const useCases = [
  {
    icon: Target,
    role: "Product Managers",
    description:
      "Get structured, categorized feedback without the hassle of manual note-taking. Make data-driven decisions faster.",
    benefits: [
      "Prioritize features with real user data",
      "Track issues across sessions",
      "Generate stakeholder reports",
    ],
  },
  {
    icon: Lightbulb,
    role: "UX Researchers",
    description:
      "Conduct qualitative research sessions with automatic transcription. Focus on the conversation, not the notes.",
    benefits: [
      "Capture authentic user reactions",
      "Searchable transcripts",
      "Compare feedback across participants",
    ],
  },
  {
    icon: Bug,
    role: "QA Teams",
    description:
      "Streamline bug reporting during testing. Voice notes capture context that text-only reports miss.",
    benefits: [
      "Audio recordings for context",
      "Auto-tag bugs vs enhancements",
      "Integrate with your workflow",
    ],
  },
  {
    icon: Gauge,
    role: "Development Teams",
    description:
      "Run beta tests with real users. Get performance feedback categorized and ready to action.",
    benefits: [
      "Performance metrics correlation",
      "Real-time session monitoring",
      "Beta tester engagement tracking",
    ],
  },
];

const stats = [
  { value: "5x", label: "Faster than typing" },
  { value: "90%", label: "Accuracy in AI classification" },
  { value: "100%", label: "Browser-based, no install" },
  { value: "∞", label: "Sessions & recordings" },
];

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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="AirLog"
              width={100}
              height={26}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="AirLog"
              width={100}
              height={26}
              className="hidden dark:block"
            />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              Voice-First User Testing Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Capture Feedback at the{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Speed of Thought
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop typing. Start talking. AirLog transforms voice recordings
              into actionable insights with AI-powered transcription and
              classification.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base gap-2 group"
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base"
              >
                <Link href="/login">
                  <User className="w-4 h-4 mr-2" />
                  User Login
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Setup in 2 minutes
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-500" />
                Instant transcription
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need to Run Better Tests
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for product teams who want fast,
              organized, and actionable feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get from zero to insights in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  {/* Step Number */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    Step {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Built for Product Teams
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you are a PM, researcher, or developer—AirLog adapts to
              your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.role}
                className="p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                    <useCase.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {useCase.role}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                    <ul className="space-y-2">
                      {useCase.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Transform Your User Testing?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join product teams who capture feedback faster and ship better
              products.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base gap-2"
              >
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base"
              >
                <Link href="/admin/login" className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={80}
                height={20}
                className="dark:hidden opacity-60"
              />
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={80}
                height={20}
                className="hidden dark:block opacity-60"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AirLog. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
