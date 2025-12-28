import { NextRequest, NextResponse } from "next/server";
import type { NoteCategory } from "@/types";

const KEYWORDS: Record<NoteCategory, string[]> = {
  bug: ["bug", "error", "crash", "broken", "not working", "issue", "problem"],
  feature: ["feature", "add", "want", "need", "request", "suggestion"],
  ux: ["confusing", "unclear", "hard to", "ui", "ux", "design"],
  performance: ["slow", "lag", "performance", "loading"],
  other: [],
};

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text)
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  const lowerText = text.toLowerCase();
  const scores: Record<NoteCategory, number> = {
    bug: 0,
    feature: 0,
    ux: 0,
    performance: 0,
    other: 0,
  };
  for (const [cat, kws] of Object.entries(KEYWORDS))
    for (const kw of kws)
      if (lowerText.includes(kw)) scores[cat as NoteCategory]++;
  let maxScore = 0,
    maxCat: NoteCategory = "other";
  for (const [cat, score] of Object.entries(scores))
    if (score > maxScore) {
      maxScore = score;
      maxCat = cat as NoteCategory;
    }
  return NextResponse.json({
    category: maxCat,
    confidence: maxScore > 0 ? Math.min(0.5 + maxScore * 0.1, 0.95) : 0.3,
  });
}
