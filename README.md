# ShopPilot AI Shopping Assistant

Conversational e-commerce demo built with Next.js, TypeScript, Tailwind CSS, and OpenRouter.

## Features

- Natural language product search through a chat interface
- OpenRouter-powered shopping recommendations
- Budget-based product filtering
- Image-based product search with multimodal OpenRouter models
- Demo product catalog with a clear path to vector search
- Supabase Postgres + pgvector guidance for cloud DB setup

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

The OpenRouter key is stored in `.env.local`, which is ignored by git. Because API keys were shared in chat, rotate them before deploying a production app.

## Recommended Database

Use **Supabase Postgres with pgvector**.

Why this DB fits:

- Postgres handles normal e-commerce data: products, users, orders, chats, carts.
- pgvector stores embeddings for semantic product search.
- Supabase gives hosted Postgres, auth, storage, row-level security, and an admin dashboard.
- You can start simple and later add Stripe orders without changing databases.

## Credentials To Provide

Create a project at Supabase, then add these values to `.env.local`:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
```

Where to find them:

- `OPENROUTER_API_KEY`: OpenRouter dashboard API key
- `OPENROUTER_MODEL`: OpenRouter model id. Keep a multimodal model if you want image search.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard > Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase Dashboard > Project Settings > API Keys > Publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard > Project Settings > API > service_role key
- `DATABASE_URL`: Supabase Dashboard > Project Settings > Database > Connection string

Keep `OPENROUTER_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose them in browser code.

## Starter pgvector Schema

Run this in the Supabase SQL editor after creating the project:

```sql
create extension if not exists vector;

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  price numeric(10, 2) not null,
  rating numeric(2, 1) default 0,
  image_url text,
  tags text[] default '{}',
  embedding vector(768),
  created_at timestamptz default now()
);

create index products_embedding_idx
on products
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
```

For embeddings, use an embedding model exposed by your AI provider and store the returned vector in `products.embedding`.

## Project Structure

- `src/app/page.tsx`: main shopping assistant UI
- `src/app/api/chat/route.ts`: OpenRouter chat recommendation endpoint
- `src/app/api/image-search/route.ts`: OpenRouter image search endpoint
- `src/lib/products.ts`: demo catalog and local matcher
- `src/lib/openrouter.ts`: OpenRouter REST helper and prompt builder

## Next Build Steps

1. Add Supabase credentials to `.env.local`.
2. Seed real product data into the `products` table.
3. Generate embeddings for each product description.
4. Replace `searchProducts` with a SQL similarity query using pgvector.
5. Add Stripe checkout when you want real purchasing.
