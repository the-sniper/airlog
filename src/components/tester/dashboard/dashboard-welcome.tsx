"use client";

import { Sparkles, Sun, Moon, CloudSun } from "lucide-react";

interface DashboardWelcomeProps {
    firstName: string;
    lastName: string;
}

function getGreeting(): { text: string; icon: typeof Sun } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: CloudSun };
    return { text: "Good evening", icon: Moon };
}

function getTimeMessage(): string {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const date = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    return `${day}, ${date}`;
}

export function DashboardWelcome({ firstName, lastName }: DashboardWelcomeProps) {
    const { text: greeting, icon: TimeIcon } = getGreeting();
    const timeMessage = getTimeMessage();
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8">
            {/* Light mode gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-accent/80 dark:from-primary/80 dark:via-primary/90 dark:to-accent/60" />

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 opacity-20 dark:opacity-15">
                <div className="absolute inset-0 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            </div>
            <div className="absolute bottom-0 left-0 w-56 h-56 opacity-15 dark:opacity-10">
                <div className="absolute inset-0 bg-white rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
            </div>
            <div className="absolute top-1/2 right-1/4 w-32 h-32 opacity-10">
                <div className="absolute inset-0 bg-accent rounded-full blur-2xl" />
            </div>

            {/* Mesh pattern overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg shadow-primary/20">
                        <span className="text-2xl md:text-3xl font-bold text-white">{initials}</span>
                    </div>
                </div>

                {/* Greeting text */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <TimeIcon className="w-4 h-4 text-white/80" />
                        <span className="text-sm font-medium text-white/80">{timeMessage}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                        {greeting}, {firstName}!
                    </h1>
                    <p className="text-white/75 text-sm md:text-base max-w-lg leading-relaxed">
                        Welcome to your testing dashboard. Here&apos;s an overview of your activity and sessions.
                    </p>
                </div>

                {/* Decorative sparkle icon */}
                <div className="hidden lg:flex absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <Sparkles className="w-5 h-5 text-white/70" />
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
    );
}
