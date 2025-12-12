import Link from "next/link";
import { Mic, BarChart3, Users, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen gradient-mesh">
      <Header variant="home" />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Voice-First Feedback Platform
          </div>
          
          <div className="space-y-5">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Capture Testing
              <br />
              <span className="bg-gradient-to-r from-[#5271C0] via-[#95B2F8] to-[#B5C0F3] bg-clip-text text-transparent">
                Insights Naturally
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Record unbiased tester feedback with voice notes, automatic transcription, and actionable reports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/admin/sessions/new">
              <Button size="lg" className="w-full sm:w-auto">
                Create Session
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/join">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as Tester
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-28">
          {[
            { icon: Mic, title: "Voice Recording", desc: "Record notes hands-free with intuitive controls." },
            { icon: BarChart3, title: "Auto Transcription", desc: "Whisper-powered speech to text." },
            { icon: Users, title: "Multi-Tester", desc: "Multiple testers simultaneously." },
            { icon: ShieldCheck, title: "Bias Prevention", desc: "Isolated feedback during sessions." },
          ].map((f, i) => (
            <div 
              key={f.title} 
              className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold mb-2 text-foreground/90">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border/40 mt-32 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Echo Test — Voice-Based Testing Notes Platform
        </div>
      </footer>
    </div>
  );
}
