import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { NoteCategory } from "@/types";
import { trackOpenAIUsage } from "@/lib/track-usage";

// Initialize OpenAI client (will use OPENAI_API_KEY from env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CLASSIFICATION_PROMPT = `You are a software QA feedback classifier. Analyze the user's feedback and classify it into exactly ONE category.

Categories:
- **bug**: Something is broken, not working, crashed, or a regression (something that used to work but doesn't anymore). Phrases like "I miss being able to" or "used to work" indicate a bug/regression.
- **feature**: A request for new functionality, enhancement, or suggestion for improvement. The user wants something NEW added.
- **ux**: Feedback about user experience, interface design, confusing layouts, hard to find things, or usability issues.
- **performance**: Feedback about speed, loading times, lag, delays, or responsiveness.
- **other**: Feedback that doesn't fit the above categories, or general comments/praise.

Important distinctions:
- "I miss being able to X" = bug (implies regression - it worked before)
- "I wish I could X" = feature (wants something new)
- "The feature X is broken" = bug (not feature)
- "It would be nice to have X" = feature

Respond with ONLY a JSON object in this exact format:
{"category": "bug|feature|ux|performance|other", "confidence": 0.0-1.0, "reasoning": "brief explanation"}`;

// Fallback keyword-based classification
function keywordClassify(text: string): { category: NoteCategory; confidence: number } {
  const lowerText = text.toLowerCase();
  
  const patterns: { category: NoteCategory; keywords: string[]; phrases: string[] }[] = [
    {
      category: "bug",
      keywords: ["bug", "error", "crash", "broken", "issue", "problem", "fails", "freeze", "stuck", "glitch"],
      phrases: ["not working", "doesn't work", "won't work", "used to work", "stopped working", "no longer", "i miss being able"],
    },
    {
      category: "feature",
      keywords: ["feature", "request", "suggestion", "enhancement", "idea"],
      phrases: ["would be nice", "could you add", "please add", "i want", "i wish", "it would be great"],
    },
    {
      category: "ux",
      keywords: ["confusing", "unclear", "ui", "ux", "design", "layout"],
      phrases: ["hard to find", "hard to use", "not obvious", "where is"],
    },
    {
      category: "performance",
      keywords: ["slow", "lag", "performance", "loading", "latency", "delay"],
      phrases: ["takes too long", "too slow", "keeps loading"],
    },
  ];

  let bestMatch: NoteCategory = "other";
  let bestScore = 0;

  for (const pattern of patterns) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (lowerText.includes(kw)) score += 2;
    }
    for (const phrase of pattern.phrases) {
      if (lowerText.includes(phrase)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern.category;
    }
  }

  return {
    category: bestMatch,
    confidence: bestScore > 0 ? Math.min(0.5 + bestScore * 0.1, 0.85) : 0.3,
  };
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text)
    return NextResponse.json({ error: "Text required" }, { status: 400 });

  // Try LLM classification first
  if (process.env.OPENAI_API_KEY) {
    const startTime = Date.now();
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: CLASSIFICATION_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: "json_object" },
      });

      const durationMs = Date.now() - startTime;
      
      // Track usage (fire and forget)
      trackOpenAIUsage("classify", completion.usage, durationMs);

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const result = JSON.parse(content);
        const validCategories: NoteCategory[] = ["bug", "feature", "ux", "performance", "other"];
        
        if (validCategories.includes(result.category)) {
          return NextResponse.json({
            category: result.category as NoteCategory,
            confidence: Math.round((result.confidence || 0.9) * 100) / 100,
            reasoning: result.reasoning,
            method: "llm",
          });
        }
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      trackOpenAIUsage("classify", undefined, durationMs, false, String(error));
      console.error("LLM classification failed, falling back to keywords:", error);
    }
  }

  // Fallback to keyword-based classification
  const result = keywordClassify(text);
  return NextResponse.json({
    ...result,
    method: "keywords",
  });
}
