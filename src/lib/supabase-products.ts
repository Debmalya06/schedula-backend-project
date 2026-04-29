import { createClient } from "@supabase/supabase-js";
import type { Product } from "./products";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number | string;
  rating: number | string | null;
  image_url: string | null;
  brand: string | null;
  tags: string[] | null;
  stock: number | null;
};

const accents = [
  "#14b8a6",
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#dc2626",
  "#eab308",
  "#16a34a",
  "#db2777",
];

const stopWords = new Set([
  "for",
  "the",
  "and",
  "with",
  "under",
  "best",
  "need",
  "want",
  "find",
  "good",
  "great",
]);

const querySynonyms: Record<string, string[]> = {
  airpods: ["earbuds", "earphones", "headphones", "wireless", "audio"],
  audio: ["earbuds", "earphones", "headphones", "speaker", "wireless"],
  earbuds: ["earphones", "headphones", "airpods", "beats", "wireless", "audio"],
  earphones: ["earbuds", "headphones", "airpods", "beats", "wireless", "audio"],
  fitness: ["gym", "sports", "waterproof", "wireless"],
  gym: ["fitness", "sports", "wireless", "earphones", "earbuds"],
  headphones: ["earbuds", "earphones", "airpods", "beats", "wireless", "audio"],
  laptop: ["computer", "notebook", "macbook"],
  lighting: ["lamp", "desk", "home-decoration"],
  phone: ["smartphone", "smartphones", "mobile", "iphone", "samsung", "oppo", "realme"],
  smartphone: ["phone", "mobile", "iphone", "samsung", "oppo", "realme"],
  travel: ["backpack", "bag", "luggage"],
  wireless: ["bluetooth", "earbuds", "earphones", "headphones", "beats", "airpods"],
};

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function rowToProduct(row: ProductRow, index: number): Product {
  const tags = row.tags ?? [];
  const category = row.category.replaceAll("-", " ");

  return {
    id: row.id,
    name: row.name,
    category,
    price: Number(row.price),
    rating: Number(row.rating ?? 0),
    reviews: Math.max(12, Number(row.stock ?? 0) * 7),
    tags,
    image: initials(row.name) || "SP",
    imageUrl: row.image_url ?? undefined,
    accent: accents[index % accents.length],
    description: row.description,
    bestFor: `${category} buyers${tags.length ? ` looking for ${tags.join(", ")}` : ""}`,
  };
}

function getQueryTerms(query: string) {
  const baseTerms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9-]/g, ""))
    .filter((term) => term.length >= 3 && !stopWords.has(term));

  return Array.from(
    new Set(baseTerms.flatMap((term) => [term, ...(querySynonyms[term] ?? [])])),
  );
}

function productHaystack(row: ProductRow) {
  return [
    row.name,
    row.category,
    row.description,
    row.brand ?? "",
    ...(row.tags ?? []),
  ]
    .join(" ")
    .replaceAll("-", " ")
    .toLowerCase();
}

function scoreProduct(row: ProductRow, queryTerms: string[]) {
  const haystack = productHaystack(row);
  const name = row.name.toLowerCase();
  const category = row.category.replaceAll("-", " ").toLowerCase();
  const tags = (row.tags ?? []).join(" ").replaceAll("-", " ").toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (name.includes(term)) {
      score += 5;
    }

    if (tags.includes(term)) {
      score += 4;
    }

    if (category.includes(term)) {
      score += 3;
    }

    if (haystack.includes(term)) {
      score += 1;
    }
  }

  if (
    queryTerms.some((term) =>
      ["earbuds", "earphones", "headphones", "airpods", "wireless"].includes(
        term,
      ),
    ) &&
    /earbuds|earphones|headphones|airpods|beats|wireless|audio|bluetooth/.test(
      haystack,
    )
  ) {
    score += 8;
  }

  if (
    queryTerms.some((term) =>
      ["phone", "smartphone", "smartphones", "mobile"].includes(term),
    ) &&
    /smartphones|phone|iphone|samsung|oppo|realme|vivo|mobile/.test(haystack)
  ) {
    score += 8;
  }

  return score + Number(row.rating ?? 0) / 10;
}

function hasAudioIntent(queryTerms: string[]) {
  return queryTerms.some((term) =>
    ["earbuds", "earphones", "headphones", "airpods", "audio"].includes(term),
  );
}

function hasPhoneIntent(queryTerms: string[]) {
  return queryTerms.some((term) =>
    ["phone", "smartphone", "smartphones"].includes(term),
  );
}

function rowMatchesAudio(row: ProductRow) {
  return /earbuds|earphones|headphones|airpods|beats/.test(
    productHaystack(row),
  );
}

function rowMatchesPhone(row: ProductRow) {
  return /smartphones|phone|iphone|samsung|oppo|realme|vivo|mobile/.test(
    productHaystack(row),
  );
}

export async function searchSupabaseProducts(query: string, budget?: number) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let request = supabase
    .from("products")
    .select("id,name,category,description,price,rating,image_url,brand,tags,stock")
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(120);

  if (budget) {
    request = request.lte("price", budget);
  }

  const { data, error } = await request;

  if (error || !data?.length) {
    return [];
  }

  const queryTerms = getQueryTerms(query);
  const scoredRows = data
    .map((row) => ({
      row: row as ProductRow,
      score: scoreProduct(row as ProductRow, queryTerms),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.row.rating ?? 0) - Number(a.row.rating ?? 0),
    )
    .slice(0, 8);

  const audioRows = scoredRows.filter(({ row }) => rowMatchesAudio(row));
  const phoneRows = scoredRows.filter(({ row }) => rowMatchesPhone(row));

  if (hasAudioIntent(queryTerms) && audioRows.length) {
    return audioRows.map(({ row }, index) => rowToProduct(row, index));
  }

  if (hasPhoneIntent(queryTerms) && phoneRows.length) {
    return phoneRows.map(({ row }, index) => rowToProduct(row, index));
  }

  return scoredRows.map(({ row }, index) => rowToProduct(row, index));
}
