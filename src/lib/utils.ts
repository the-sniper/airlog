import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date): string { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(date)); }
export function formatDuration(seconds: number): string { const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2, "0")}`; }
export function generateInviteToken(): string { const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; let token = ""; for (let i = 0; i < 12; i++) token += chars.charAt(Math.floor(Math.random() * chars.length)); return token; }
export function getCategoryLabel(category: string): string { return { bug: "Bug", feature: "Feature", ux: "UX Feedback", performance: "Performance", other: "Other" }[category] || "Other"; }
export function getStatusLabel(status: string): string { return { draft: "Draft", active: "Active", completed: "Completed" }[status] || "Unknown"; }
