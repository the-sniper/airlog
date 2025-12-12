import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Echo Test - Voice-Based Testing Notes", description: "Capture unbiased tester feedback with voice notes and automatic transcription." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>{children}<Toaster /></body></html>;
}
