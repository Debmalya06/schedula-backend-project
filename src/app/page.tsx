"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { formatInrFromUsd } from "@/lib/currency";
import type { Product } from "@/lib/products";
import { products as seedProducts } from "@/lib/products";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type WorkflowState = "ready" | "running" | "done";

const quickPrompts = [
  {
    text: "Best wireless earbuds for gym under ₹12,500",
    budget: 150,
  },
  {
    text: "I need a study desk setup with good lighting under ₹7,000",
    budget: 85,
  },
  {
    text: "Find a travel backpack for laptop and weekend trips under ₹10,000",
    budget: 120,
  },
];

async function prepareImageForSearch(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.type === "image/heic" || file.type === "image/heif") {
    throw new Error("HEIC images are not supported yet. Please upload JPG or PNG.");
  }

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read this image."));
      image.src = imageUrl;
    });

    const maxSize = 900;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Image processing is unavailable in this browser.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const imageBase64 = dataUrl.split(",")[1];

    if (!imageBase64) {
      throw new Error("Could not prepare this image for search.");
    }

    return {
      imageBase64,
      mimeType: "image/jpeg",
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I am ShopPilot. Tell me what you are buying, your budget, and any must-have features.",
    },
  ]);
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState(250);
  const [recommendations, setRecommendations] =
    useState<Product[]>(seedProducts.slice(0, 4));
  const [workflow, setWorkflow] = useState<WorkflowState>("ready");
  const [imageQuery, setImageQuery] = useState("No image uploaded yet");

  const visibleBudget = useMemo(() => formatInrFromUsd(budget), [budget]);

  async function sendMessage(nextMessage = input, nextBudget = budget) {
    const cleanMessage = nextMessage.trim();

    if (!cleanMessage) {
      return;
    }

    setInput("");
    setWorkflow("running");
    setMessages((current) => [
      ...current,
      { role: "user", content: cleanMessage },
      { role: "assistant", content: "Searching products and checking fit..." },
    ]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: cleanMessage, budget: nextBudget }),
    });
    const data = (await response.json()) as {
      reply: string;
      products: Product[];
      source: string;
    };

    setRecommendations(data.products);
    setMessages((current) => [
      ...current.slice(0, -1),
      { role: "assistant", content: data.reply },
    ]);
    setWorkflow("done");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setWorkflow("running");
    setImageQuery("Reading image...");
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: "Reading the image and looking for matching products...",
      },
    ]);

    try {
      const imagePayload = await prepareImageForSearch(file);
      const response = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imagePayload),
      });
      const data = (await response.json()) as {
        query: string;
        products: Product[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Image search failed.");
      }

      setImageQuery(data.query);
      setRecommendations(data.products);
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "assistant",
          content: `Image search found: ${data.query}. I updated your product matches.`,
        },
      ]);
      setWorkflow("done");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image search failed.";

      setImageQuery(message);
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "assistant",
          content: message,
        },
      ]);
      setWorkflow("done");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-xl font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold">ShopPilot AI</h1>
              <p className="text-sm text-slate-500">
                Conversational e-commerce powered by OpenRouter
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Demo catalog online
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Shopping Chat</h2>
                <p className="text-sm text-slate-500">
                  Search naturally, filter by budget, compare options.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                AI
              </span>
            </div>

            <div className="mb-4 h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6 ${
                      message.role === "user"
                        ? "ml-auto bg-blue-600 text-white"
                        : "bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Budget: {visibleBudget}
                </label>
                <input
                  type="range"
                  min="25"
                  max="1200"
                  step="25"
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask for products, features, brands, budget..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Send
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => {
                    setBudget(prompt.budget);
                    sendMessage(prompt.text, prompt.budget);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Image Product Search</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload a product photo or inspiration image.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
              Upload image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              Visual query: {imageQuery}
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Recommendation Workflow</h2>
                <p className="text-sm text-slate-500">
                  Chat, embed, retrieve, rank, and recommend.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {workflow === "running"
                  ? "Running"
                  : workflow === "done"
                    ? "Completed"
                    : "Ready"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {[
                ["Chat", "Collect intent"],
                ["Embed", "Vectorize query"],
                ["Search", "pgvector match"],
                ["Rank", "Budget and fit"],
                ["Reply", "OpenRouter answer"],
              ].map(([title, detail], index) => (
                <div
                  key={title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-bold text-blue-700 shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((product) => (
              <article
                key={product.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="mb-4 aspect-[4/3] w-full rounded-lg bg-slate-100 object-contain p-3"
                  />
                ) : (
                  <div
                    className="mb-4 flex aspect-[4/3] items-center justify-center rounded-lg text-3xl font-black text-white"
                    style={{ backgroundColor: product.accent }}
                  >
                    {product.image}
                  </div>
                )}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {product.category}
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-6">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-base font-bold">
                    {formatInrFromUsd(product.price)}
                  </p>
                </div>
                <p className="min-h-[64px] text-sm leading-6 text-slate-600">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="font-semibold text-amber-600">
                    {product.rating} stars
                  </span>
                  <span className="text-slate-500">{product.reviews} reviews</span>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold">DB Choice</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use Supabase Postgres with pgvector for products, users,
                orders, chats, and embedding similarity search.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Credentials Needed</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add Supabase URL, service role key, and database connection URL
                in the local environment file.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Next Step</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seed real products, generate embeddings, then replace the demo
                matcher with pgvector queries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
