import { NextResponse } from "next/server";
import { formatInrFromUsd } from "@/lib/currency";
import { buildShoppingPrompt, generateOpenRouterText } from "@/lib/openrouter";
import { searchProducts as searchLocalProducts } from "@/lib/products";
import { searchSupabaseProducts } from "@/lib/supabase-products";

type ChatRequest = {
  message?: string;
  budget?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json(
      { error: "Please send a shopping request." },
      { status: 400 },
    );
  }

  const dbMatches = await searchSupabaseProducts(message, body.budget);
  const matches = dbMatches.length
    ? dbMatches
    : searchLocalProducts(message, body.budget);
  const prompt = buildShoppingPrompt({
    message,
    budget: body.budget,
    products: matches,
  });

  try {
    const aiText = await generateOpenRouterText(prompt);

    return NextResponse.json({
      reply:
        aiText ??
        `I found ${matches.length} strong match${matches.length === 1 ? "" : "es"} in the product catalog. ${
          body.budget
            ? `I kept everything under ${formatInrFromUsd(body.budget)}. `
            : ""
        }My top pick is ${matches[0]?.name ?? "not available yet"} because it fits your request best.`,
      products: matches,
      source: aiText
        ? dbMatches.length
          ? "openrouter-supabase"
          : "openrouter-demo"
        : dbMatches.length
          ? "supabase-fallback"
          : "demo-fallback",
    });
  } catch (error) {
    return NextResponse.json(
      {
        reply:
          "OpenRouter could not respond right now, so I used local product matching instead.",
        products: matches,
        source: dbMatches.length ? "supabase-fallback" : "demo-fallback",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}
