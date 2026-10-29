# Random Picks NG

Next.js storefront with Supabase products, ordering, tracking, and an embedded shopping assistant.

## Shopping assistant

The **Ask Pick** button appears on public pages and stays hidden in the admin area. It supports product searches, naira budgets, product details, and links to the existing product, order-tracking, and support flows. On a product page, questions can refer to the product being viewed.

The server reads the public `products` table using the same Supabase URL and publishable key as the storefront. It selects only product fields. It does not query customer orders or use the Supabase service role key. Delivery charges, delivery times, returns, warranties, and payment policies are referred to support when the catalog does not establish an answer.

### Run locally

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in the existing store environment values from your deployment. Keep `.env.local` out of Git.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Open **Ask Pick** and try `Show me smartwatches`, `What can I get under ₦10,000?`, or `How do I track my order?`.

Catalog replies work without an AI account. To enable optional AI phrasing, configure both `OPENAI_API_KEY` and `OPENAI_MODEL` on the server and restart or redeploy. Use a model available to your API project. API calls use the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text), with `store: false`. Keys stay on the server. If the provider fails, the assistant falls back to its catalog reply.

### Integrate with the existing deployment

The integration adds `app/components/shopping-assistant.tsx`, its CSS module, `lib/shop-assistant.ts`, and `app/api/chat/route.ts`. The root layout renders the widget after the page content. No database migration or additional package is required. Keep the store’s existing environment variables in Vercel; add the optional OpenAI variables only if desired.

Preview builds need only the public catalog credentials for the storefront and chatbot. The existing tracking and email routes check their server credentials when called and return a temporary-unavailable response if those credentials are absent. Production-only service credentials can stay scoped to production.

Chat history is kept in memory for the current tab, limited before being sent, and cleared with **Clear conversation** or a page reload. The chat does not send support emails or place orders; its links take visitors to the relevant existing flow. The route includes input limits, upstream timeouts, and a bounded in-memory request limiter. The limiter is per server process; use hosting-level rate limits if shared limits across serverless instances are needed.

### Checks

The catalog regression tests run on Node.js 22.18+:

```sh
node --experimental-strip-types --test tests/shop-assistant.test.mjs
```

They cover currency and budget parsing, strict price boundaries, contextual colour and cheaper-product questions, stock, unknown products, request validation, and safe catalog normalization. The optional AI integration needs real provider credentials for a live provider check.

## Original Next.js notes

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
