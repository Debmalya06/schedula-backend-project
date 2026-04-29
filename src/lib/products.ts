export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
  image: string;
  imageUrl?: string;
  accent: string;
  description: string;
  bestFor: string;
};

export const products: Product[] = [
  {
    id: "aurora-buds-pro",
    name: "Aurora Buds Pro",
    category: "Audio",
    price: 129,
    rating: 4.8,
    reviews: 1842,
    tags: ["noise cancelling", "wireless", "gym", "travel", "calls"],
    image: "AB",
    accent: "#14b8a6",
    description: "Compact ANC earbuds with 32-hour battery life and clear call mics.",
    bestFor: "commuters who want light earbuds with strong noise control",
  },
  {
    id: "nova-phone-16-case",
    name: "Nova Phone 16 Armor Case",
    category: "Accessories",
    price: 34,
    rating: 4.6,
    reviews: 913,
    tags: ["phone case", "iphone", "drop protection", "clear", "budget"],
    image: "NC",
    accent: "#2563eb",
    description: "Slim transparent case with reinforced corners and MagSafe support.",
    bestFor: "buyers who want protection without hiding their phone color",
  },
  {
    id: "focusbook-air-14",
    name: "FocusBook Air 14",
    category: "Laptops",
    price: 899,
    rating: 4.7,
    reviews: 624,
    tags: ["laptop", "student", "lightweight", "battery", "productivity"],
    image: "FA",
    accent: "#7c3aed",
    description: "Thin 14-inch laptop with all-day battery life and a bright display.",
    bestFor: "students and remote workers who value portability",
  },
  {
    id: "stride-fit-watch",
    name: "Stride Fit Watch",
    category: "Wearables",
    price: 179,
    rating: 4.5,
    reviews: 1197,
    tags: ["fitness", "watch", "heart rate", "sleep", "waterproof"],
    image: "SW",
    accent: "#f97316",
    description: "Fitness smartwatch with sleep insights, GPS, and seven-day battery.",
    bestFor: "health tracking without a premium watch price",
  },
  {
    id: "pixelchef-air-fryer",
    name: "PixelChef Air Fryer Max",
    category: "Home",
    price: 99,
    rating: 4.4,
    reviews: 808,
    tags: ["kitchen", "air fryer", "family", "easy clean", "healthy"],
    image: "PF",
    accent: "#dc2626",
    description: "Six-liter air fryer with presets, quiet fan, and dishwasher-safe basket.",
    bestFor: "families who cook quick weeknight meals",
  },
  {
    id: "luma-desk-lamp",
    name: "Luma Desk Lamp",
    category: "Office",
    price: 58,
    rating: 4.9,
    reviews: 452,
    tags: ["desk", "study", "lamp", "usb-c", "adjustable"],
    image: "LL",
    accent: "#eab308",
    description: "Adjustable lamp with warm/cool lighting and USB-C device charging.",
    bestFor: "study desks and compact workspaces",
  },
  {
    id: "trailpack-35",
    name: "TrailPack 35L",
    category: "Travel",
    price: 84,
    rating: 4.6,
    reviews: 721,
    tags: ["backpack", "travel", "water resistant", "laptop", "carry on"],
    image: "TP",
    accent: "#16a34a",
    description: "Weather-resistant carry-on backpack with laptop sleeve and shoe pocket.",
    bestFor: "short trips and daily commuting",
  },
  {
    id: "cinebeam-mini",
    name: "CineBeam Mini Projector",
    category: "Entertainment",
    price: 249,
    rating: 4.3,
    reviews: 386,
    tags: ["projector", "movies", "portable", "bluetooth", "bedroom"],
    image: "CM",
    accent: "#db2777",
    description: "Portable 1080p projector with built-in speaker and wireless casting.",
    bestFor: "movie nights in small rooms",
  },
];

export function searchProducts(query: string, budget?: number) {
  const normalized = query.toLowerCase();
  const scored = products
    .filter((product) => !budget || product.price <= budget)
    .map((product) => {
      const haystack = [
        product.name,
        product.category,
        product.description,
        product.bestFor,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase();

      const score = normalized
        .split(/\s+/)
        .filter(Boolean)
        .reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);

      return { product, score };
    })
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

  return scored.slice(0, 4).map(({ product }) => product);
}
