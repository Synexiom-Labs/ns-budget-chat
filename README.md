# NS Budget Chat

**Understand your provincial budget in plain language.**

A free, open-source AI chatbot for the Nova Scotia Budget 2026–27. Ask questions in plain English, get accurate answers with citations from the official documents. No subscription. No signup.

> *Built so you don't need an AI subscription or a finance degree to understand where your tax dollars are going.*

---

## How It Works

```
Your question
    ↓
Query classification (factual / comparison / explanation / exploratory / out-of-scope)
    ↓
Cache check (Upstash Redis — 1 week TTL for repeated questions)
    ↓
Hybrid Retrieval (Voyage AI embeddings → Pinecone + pre-structured financial tables)
    ↓
Context Assembly (reranked, deduplicated, up to 8 chunks)
    ↓
Claude Sonnet 4.5 (reasoning + citation enforcement, full conversation history)
    ↓
Cited answer with source badges + optional Sources panel (PDF links)
```

- **RAG pipeline** over all six NS Budget 2026–27 documents (217 indexed chunks)
- **Pre-structured financial tables** for accurate numerical answers — no hallucinated figures
- **Citation mandate** — every factual claim references a source document and page number
- **Response caching** — repeated popular questions are served from Redis at zero API cost
- **Rate limiting** — 20 requests/minute per IP via Upstash Redis sliding window
- **Multi-turn context** — full conversation history passed to Claude on every request
- **Sources panel** — click any response's "sources found" button to see all referenced PDF pages with direct links

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- Voyage AI API key — free 200M tokens ([dash.voyageai.com](https://dash.voyageai.com))
- Pinecone API key — free serverless tier ([pinecone.io](https://pinecone.io))
- Upstash Redis — free tier, optional but recommended ([upstash.com](https://upstash.com))

### 1. Clone and install

```bash
git clone https://github.com/synexiom-labs/ns-budget-chat.git
cd ns-budget-chat
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

Required variables:

```env
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
PINECONE_API_KEY=...
PINECONE_INDEX=ns-budget-chat

# Optional — rate limiting and caching (highly recommended)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional — tuning
RATE_LIMIT_RPM=20          # requests per minute per IP (default: 20)
MAX_OUTPUT_TOKENS=1500     # max response length (default: 1500)
CACHE_TTL_HOURS=168        # cache lifetime in hours (default: 168 = 1 week)
```

### 3. Verify your Voyage API key

```bash
npm run tsx scripts/test-voyage.ts
# Should print: ✅ Voyage API is working! Dimensions: 1024
```

### 4. Ingest budget documents

```bash
# Download all 6 PDFs from Nova Scotia government
npm run ingest

# Extract text, chunk, and structure content
npm run process

# Generate embeddings and populate Pinecone
npm run index
```

> The index step uses Voyage AI to embed ~217 chunks. On the free Voyage tier, this takes a few minutes with rate-limit pausing between batches.

### 5. Run the app

```bash
npm run dev
# Open http://localhost:3000
```

### 6. (Optional) Validate accuracy

```bash
# Run ground-truth test suite against local server
npm run validate
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/synexiom-labs/ns-budget-chat)

Set the following environment variables in your Vercel project settings:

```
ANTHROPIC_API_KEY        (required)
VOYAGE_API_KEY           (required)
PINECONE_API_KEY         (required)
PINECONE_INDEX           (required)
UPSTASH_REDIS_REST_URL   (recommended — enables rate limiting + caching)
UPSTASH_REDIS_REST_TOKEN (recommended)
RATE_LIMIT_RPM           (optional, default 20)
MAX_OUTPUT_TOKENS        (optional, default 1500)
CACHE_TTL_HOURS          (optional, default 168)
```

> **Important:** Run the ingest pipeline locally first to populate your Pinecone index. The Vercel app reads from Pinecone at query time — it does not process PDFs during deployment.

Vercel auto-deploys from `main` on every push. Preview deployments are created for all PRs.

---

## Adapting for Other Budgets

This project is intentionally generic. To use it for a different budget or jurisdiction:

1. **Swap the PDFs** — update `scripts/ingest.ts` with your document URLs
2. **Update doc config** — edit `scripts/process.ts` with your document names and types
3. **Re-structure tables** — update `data/tables/*.json` with your key financial figures
4. **Update PDF URL mapping** — edit `lib/pdf-urls.ts` to map document names to PDF links
5. **Update ground truth** — edit `data/ground-truth.json` with verified Q&A pairs
6. **Adjust the system prompt** — update `lib/rag/prompts.ts` for your jurisdiction
7. **Run the ingest pipeline** — `npm run ingest && npm run process && npm run index`

---

## Project Structure

```
ns-budget-chat/
├── app/
│   ├── page.tsx                  # Main layout: header, sidebar, chat, footer
│   ├── layout.tsx                # Root layout + Vercel Analytics
│   ├── globals.css               # Global styles, animations (fadeUp, panelSlide)
│   ├── icon.svg                  # Favicon (Synexiom Labs logo)
│   └── api/
│       └── chat/route.ts         # Chat endpoint — rate limit, cache, RAG, stream
├── components/
│   ├── ChatInterface.tsx          # Main chat state: messages, input, panel
│   ├── MessageBubble.tsx          # Message rendering + citation badge parsing
│   ├── CitationBadge.tsx          # Inline source reference badge
│   ├── SuggestedQuestions.tsx     # Landing state starter question cards
│   ├── SourcesPanel.tsx           # Slide-in right panel: PDF source links
│   ├── InfoSidebar.tsx            # Desktop left sidebar: branding + links
│   ├── MobileMenu.tsx             # Mobile hamburger menu with tracked links
│   └── Footer.tsx                 # Disclaimer + attribution
├── lib/
│   ├── rag/
│   │   ├── retriever.ts           # Hybrid retrieval: semantic + structured table
│   │   ├── embeddings.ts          # Voyage AI embedding generation
│   │   ├── reranker.ts            # Chunk reranking + context assembly
│   │   └── prompts.ts             # System prompt template + out-of-scope reply
│   ├── pdf/
│   │   ├── extractor.ts           # PDF text extraction (pdf-parse)
│   │   └── chunker.ts             # Content-aware chunking (500–800 tokens)
│   ├── cache.ts                   # Redis response cache (read + write)
│   ├── rate-limit.ts              # Sliding window rate limiter (Upstash)
│   ├── tables.ts                  # Pre-structured financial table lookup
│   ├── pdf-urls.ts                # Document name → PDF URL mapping
│   └── utils.ts                   # Shared utilities
├── scripts/
│   ├── ingest.ts                  # Download all budget PDFs
│   ├── process.ts                 # Extract, chunk, structure content
│   ├── index-vectors.ts           # Generate embeddings + populate Pinecone
│   ├── validate.ts                # Run accuracy test suite
│   └── test-voyage.ts             # Diagnostic: verify Voyage API connectivity
├── public/
│   └── synexiom-logo.svg          # Synexiom Labs logo (header + components)
├── data/                          # (gitignored)
│   ├── pdfs/                      # Raw downloaded PDFs
│   ├── chunks/                    # Processed text chunks (JSON)
│   ├── tables/                    # Pre-structured financial tables (JSON)
│   └── ground-truth.json          # Validated Q&A pairs for testing
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── TECH-SPEC.md
```

---

## Cost Estimate

The dominant cost is Claude API calls. Voyage AI and Pinecone are effectively free at this scale.

| Service | Per-query cost | Monthly (1,000 queries) |
|---------|---------------|------------------------|
| **Claude Sonnet 4.5** | ~$0.016 | ~$11–16 (with caching) |
| Voyage AI Embeddings | ~$0.000001 | <$0.01 (200M free tokens) |
| Pinecone | $0 | $0 (free tier) |
| Upstash Redis | $0 | $0 (free tier covers ~3,300 queries/day) |
| Vercel Hosting | $0 | $0 (Hobby tier) |
| **Total** | **~$0.016** | **~$11–16** |

Response caching (Redis, 1-week TTL) means repeated popular questions cost nothing after the first answer. In practice, a few hundred Nova Scotians asking the same top-10 questions will result in significant cache hit rates.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome.

Issues labelled `good first issue` are a great starting point.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Created by Meghraj and Ruturaaj Solanki Powered by [Synexiom Labs](https://synexiomlabs.com).*
