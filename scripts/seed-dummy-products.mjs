import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function buildBestFor(product) {
  const category = String(product.category ?? "shopping").replaceAll("-", " ");
  const tags = Array.isArray(product.tags) ? product.tags.join(", ") : category;

  return `${category} buyers looking for ${tags}`;
}

const response = await fetch("https://dummyjson.com/products?limit=0");

if (!response.ok) {
  throw new Error(`DummyJSON request failed with status ${response.status}`);
}

const data = await response.json();

const categoryPriority = [
  "smartphones",
  "laptops",
  "tablets",
  "mobile-accessories",
  "sports-accessories",
  "kitchen-accessories",
  "home-decoration",
  "furniture",
  "mens-watches",
  "womens-watches",
  "mens-shoes",
  "womens-shoes",
  "womens-bags",
  "sunglasses",
  "beauty",
];

const selectedProducts = [...data.products]
  .sort((a, b) => {
    const aPriority = categoryPriority.indexOf(a.category);
    const bPriority = categoryPriority.indexOf(b.category);

    return (
      (aPriority === -1 ? 999 : aPriority) -
        (bPriority === -1 ? 999 : bPriority) || b.rating - a.rating
    );
  })
  .slice(0, 100);

const { error: deleteError } = await supabase
  .from("products")
  .delete()
  .eq("source", "dummyjson");

if (deleteError) {
  throw deleteError;
}

const products = selectedProducts.map((product) => ({
  id: `dummyjson-${product.id}`,
  name: product.title,
  category: product.category,
  description: product.description,
  price: product.price,
  rating: product.rating,
  image_url: product.thumbnail,
  brand: product.brand ?? null,
  tags: product.tags ?? [],
  stock: product.stock ?? 0,
  source: "dummyjson",
}));

const { error } = await supabase
  .from("products")
  .upsert(products, { onConflict: "id" });

if (error) {
  throw error;
}

console.log(`Seeded ${products.length} products into Supabase.`);
console.log(`Example: ${products[0].name} - ${buildBestFor(selectedProducts[0])}`);
