# ShopPilot AI

ShopPilot AI is a conversational e-commerce assistant that helps users discover products through natural language instead of traditional search filters. A user can describe what they need, set a budget, upload a product image, and receive smart product suggestions with short reasons for each recommendation.

The project is built around the idea that online shopping should feel more like talking to a helpful store assistant. Instead of forcing users to guess exact keywords or manually compare many products, ShopPilot AI understands intent, checks available products, considers the user's budget, and returns practical recommendations.

## Project Value

Most e-commerce websites depend on category menus, search boxes, and manual filtering. That works when users already know what they want, but it becomes slow when the user is exploring, comparing, or shopping with a specific need.

ShopPilot AI improves that experience by letting users ask questions in normal language, such as:

- "Best wireless earbuds for gym under Rs. 12,500"
- "I need a study desk setup with good lighting"
- "Find a travel backpack for laptop and weekend trips"

The assistant then turns the request into product matches, ranks the options, and explains the best choices in a simple conversational reply.

## What The Project Does

ShopPilot AI gives users an interactive shopping experience where they can:

- Search products using natural language
- Get personalized product recommendations
- Filter suggestions by budget
- Compare product options with AI-generated reasoning
- Upload an image and find visually related products
- View recommended products with price, category, rating, image, and description
- Use quick prompt examples to try common shopping scenarios

The current version includes a working demo catalog and also supports Supabase product data when database credentials are configured. If the database is unavailable, the app still works with the local demo product catalog.

## Main Features

### Conversational Shopping Chat

Users can type what they are looking for in plain language. The assistant responds with product suggestions and explains why those products fit the user's request.

### Budget-Based Filtering

The budget slider helps users control how much they want to spend. Product results are filtered and ranked with the selected budget in mind, so the recommendations stay realistic.

### Personalized Recommendations

The assistant considers product names, categories, tags, descriptions, ratings, and user intent to recommend items that are more relevant than simple keyword search results.

### Image-Based Product Search

Users can upload a product photo or inspiration image. The app reads the image, converts it into a shopping query, and returns matching product recommendations.

### Recommendation Workflow View

The interface shows the recommendation journey: chat, embed, search, rank, and reply. This makes the AI shopping flow easy to understand from the user's point of view.

### Product Cards

Recommended products are displayed with useful shopping information, including image, name, category, price, description, rating, and reviews.

## Why It Is Useful

ShopPilot AI is useful for shoppers who:

- Know their need but not the exact product name
- Want recommendations within a fixed budget
- Need help comparing similar products
- Prefer asking questions instead of using many filters
- Want to search using an image or visual inspiration

It is also useful as a project because it demonstrates how AI can make e-commerce more helpful, guided, and user-friendly.

## Example Use Cases

- A student asks for a laptop or desk setup within a budget.
- A fitness user searches for wireless earbuds for gym use.
- A traveler looks for a backpack that fits both laptop and weekend travel needs.
- A buyer uploads an image of a product style and asks the app to find similar items.
- A shopper compares two or three recommendations before deciding what to buy.

## Tech Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- OpenRouter for AI responses and vision-based search
- Supabase Postgres for product data
- pgvector / embeddings for vector-search direction
- Stripe can be added later for checkout and payments

## How It Works

1. The user enters a shopping request or uploads an image.
2. The app understands the user's intent.
3. Product data is searched from Supabase or the demo catalog.
4. Results are filtered by budget and relevance.
5. OpenRouter generates a helpful shopping reply.
6. The user sees both the AI explanation and matching product cards.

## Current Status

The project currently works as a conversational shopping assistant demo with:

- Chat-based recommendations
- Budget control
- Local demo products
- Supabase product search support
- Image upload search
- AI-generated shopping replies

Future improvements can include real user accounts, saved wishlists, cart management, order history, advanced vector search, and Stripe checkout.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app at:

```bash
http://localhost:3000
```

## Environment Setup

Create a `.env.local` file for AI and database features:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_VISION_MODEL=google/gemini-2.5-flash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The app can still run with demo products if Supabase is not configured.
