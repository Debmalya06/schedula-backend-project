import { Product } from "./products";
import { formatInrFromUsd } from "./currency";

type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
};

const OPENROUTER_TEXT_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const OPENROUTER_VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.5-flash";

function readOpenRouterContent(content: OpenRouterResponse["choices"]) {
  const responseContent = content?.[0]?.message?.content;

  if (typeof responseContent === "string") {
    return responseContent.trim() || null;
  }

  return (
    responseContent
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() || null
  );
}

export async function generateOpenRouterText(
  content: string | OpenRouterContentPart[],
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = Array.isArray(content)
    ? OPENROUTER_VISION_MODEL
    : OPENROUTER_TEXT_MODEL;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "ShopPilot AI Shopping Assistant",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      temperature: 0.65,
      max_completion_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OpenRouter request failed with status ${response.status}: ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  return readOpenRouterContent(data.choices);
}

export function buildShoppingPrompt({
  message,
  budget,
  products,
}: {
  message: string;
  budget?: number;
  products: Product[];
}) {
  return `You are ShopPilot, a concise AI shopping assistant for a conversational e-commerce website.

User request: ${message}
Budget: ${budget ? formatInrFromUsd(budget) : "not specified"}

Candidate products:
${products
  .map(
    (product) =>
      `- ${product.name}: ${formatInrFromUsd(product.price)}, ${product.category}, rating ${product.rating}/5, tags: ${product.tags.join(", ")}, best for ${product.bestFor}`,
  )
  .join("\n")}

Reply in 3 short parts:
1. Ask at most one smart follow-up question if required.
2. Recommend the best 2-3 products with brief reasons.
3. Mention any budget trade-off clearly.
Use Indian rupees for all prices and budgets.
Do not invent products outside the candidate list.`;
}
