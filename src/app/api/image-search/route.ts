import { NextResponse } from "next/server";
import { generateOpenRouterText } from "@/lib/openrouter";
import { searchProducts as searchLocalProducts } from "@/lib/products";
import { searchSupabaseProducts } from "@/lib/supabase-products";

type ImageSearchRequest = {
  imageBase64?: string;
  mimeType?: string;
};

const supportedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as ImageSearchRequest;

  if (!body.imageBase64 || !body.mimeType) {
    return NextResponse.json(
      { error: "Upload an image to search visually." },
      { status: 400 },
    );
  }

  if (!supportedImageTypes.has(body.mimeType)) {
    return NextResponse.json(
      { error: "Please upload a PNG, JPG, WEBP, or GIF image." },
      { status: 400 },
    );
  }

  try {
    const visualDescription = await generateOpenRouterText([
      {
        type: "text",
        text: "Describe this shopping image as product search keywords. Return only a short comma-separated phrase.",
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${body.mimeType};base64,${body.imageBase64}`,
        },
      },
    ]);

    const query = visualDescription ?? "portable lifestyle product accessory";
    const dbMatches = await searchSupabaseProducts(query);
    const products = dbMatches.length ? dbMatches : searchLocalProducts(query);

    return NextResponse.json({
      query,
      products,
      source: visualDescription
        ? dbMatches.length
          ? "openrouter-vision-supabase"
          : "openrouter-vision-demo"
        : dbMatches.length
          ? "supabase-fallback"
          : "demo-fallback",
    });
  } catch (error) {
    const products = await searchSupabaseProducts("visual product accessory");

    return NextResponse.json({
      query: "visual product accessory",
      products: products.length
        ? products
        : searchLocalProducts("visual product accessory"),
      source: products.length ? "supabase-fallback" : "demo-fallback",
      error:
        error instanceof Error
          ? error.message.slice(0, 240)
          : "Unknown error",
    });
  }
}
