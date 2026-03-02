# NS Budget Chat — Technical Specification

**Project:** `ns-budget-chat`
**Version:** 1.1 — Phase 1 Complete
**Date:** March 2026
**License:** MIT (Open Source)
**Repository:** `github.com/synexiom-labs/ns-budget-chat`

---

## 1. Project Overview

### 1.1 What This Is

NS Budget Chat is a free, open-source AI chatbot that lets anyone ask plain-language questions about the Nova Scotia Budget 2026–27 and get accurate, cited answers — no subscription, no signup, no PDF wrangling required.

### 1.2 The Problem

The Nova Scotia Budget 2026–27 spans 150+ pages across six documents — dense financial tables, departmental estimates, policy narratives, and strategic plans. Citizens, municipal staff, business owners, journalists, and nonprofits all need to interpret this quickly. Most can't cross-reference multiple PDFs or parse government accounting language under time pressure.

### 1.3 Why Not Just Upload PDFs to ChatGPT/Claude?

This is the most important question. Here's the honest answer:

**For the 95% who don't have AI subscriptions:** Claude Pro and ChatGPT Plus cost $20/month. The municipal clerk in Guysborough, the small business owner trying to understand tax changes, the nonprofit director checking if their funding survived — they aren't paying for AI tools. This is free, instant, zero-signup.

**For the 5% who do:** Even with a subscription, using a frontier model for this requires downloading 35+ MB of PDFs, uploading them, waiting for processing, and knowing how to prompt well. Most people ask "what's the healthcare budget?" and get back a wall of text with no citations and possibly hallucinated numbers.

**Where this is genuinely better than raw PDF upload:**

- **Pre-structured financial tables.** Frontier models are bad at reading complex PDF tables — they misread columns, confuse row labels, hallucinate numbers. We pre-extract and structure key tables into clean JSON, so numerical answers are more accurate.
- **Cross-document linking.** Our system pre-links related content across all six documents.
- **Embedded prompt expertise.** The system prompt enforces citation, neutrality, and accuracy standards that every user benefits from, regardless of their AI experience.
- **Response caching.** Popular questions (asked by dozens of users) are answered instantly from cache at zero additional API cost.
- **Shareability.** A URL you can share with colleagues. Not a personal chat session.

**The value proposition in one line:**

> *Built so you don't need an AI subscription or a finance degree to understand where your tax dollars are going.*

### 1.4 Success Criteria (Phase 1) — Delivered

- ✅ Deployed and publicly accessible at `nsbudget.synexiomlabs.com`
- ✅ Accurately answers questions about all six budget documents with page-level citations
- ✅ All answers include source document and page references with PDF links
- ✅ Sources side panel shows clickable PDF links for every cited page
- ✅ Rate limiting (20 req/min per IP) and response caching (1-week TTL)
- ✅ Multi-turn conversation context maintained across follow-up questions
- ✅ Open-source repository published and documented for community use
- ✅ Anyone can fork this and adapt it for their own government's budget

### 1.5 Open-Source Philosophy

This project is built in the open, for the public.

- **MIT Licensed.** Anyone can use, modify, fork, and distribute.
- **Fully reproducible.** Every step from PDF ingestion to deployment is documented. A developer in New Brunswick or British Columbia should be able to fork this repo and have their own budget chatbot running within hours.
- **No paywalls, no signups.** The app collects no personal data and requires no accounts.
- **Template by design.** Budget-specific logic is separated from the RAG infrastructure so this can become a reusable pattern for any government budget, anywhere.
- **Analytics without surveillance.** Vercel Analytics tracks aggregate traffic (page views, referrers) and anonymised click events — no personal data, no cookies required.

### 1.6 Branding Approach

Synexiom Labs branding is visible but never intrusive. The civic tool is the product.

**Colour palette:**
- Void: `rgb(6, 8, 16)` — header, footer background
- Brand: `rgb(26, 58, 143)` — user bubbles, accents, left-border cards
- Surface: `rgb(248, 250, 252)` — chat area background
- Text: `rgb(30, 41, 59)` — body text

**Implementation:**
- Header: dark void background with inline Synexiom Labs SVG logo + app name (Sora font)
- Left sidebar (desktop only, 220px): Synexiom Labs logo + link, Open Source, Source Documents, AI disclaimer
- Mobile header: hamburger menu with all links and disclaimer
- Footer (single row): AI disclaimer + Built by Synexiom Labs + Open Source + Source Documents
- All Synexiom Labs link clicks are tracked as custom Vercel Analytics events (`synexiom_click`)
- Favicon: Synexiom Labs logo on dark background (`app/icon.svg`)

---

## 2. Source Documents

### 2.1 Document Inventory

| Document | Size | Pages | Content Type | Processing Strategy |
|----------|------|-------|--------------|-------------------|
| **Budget 2026–27 (Main)** | 5.7 MB | 73 | Mixed narrative + tables | Dual: tables → structured JSON, narrative → semantic chunks |
| **Budget Address** | 8.12 MB | ~30 | Narrative (speech) | Semantic chunking by topic/section |
| **Estimates & Supplementary Detail** | 10.06 MB | ~200+ | Heavy tables, dept-by-dept | Table extraction → structured JSON with dept metadata |
| **Budget Highlights** | 127 KB | ~4 | Summary bullet points | Full text as single high-priority chunk |
| **Government Business Plan** | 8.41 MB | ~100+ | Mixed strategy + outcomes | Semantic chunking by department/priority area |
| **Additional Appropriations** | 94 KB | ~2 | Small table addendum | Full text as single chunk |

**Source URL:** `https://www.novascotia.ca/documents/budget-documents-2026-2027`

**Total indexed:** 217 chunks across all six documents.

### 2.2 Document Processing Pipeline

Each document passes through three stages:

#### Stage 1: PDF Extraction (`scripts/ingest.ts` + `scripts/process.ts`)

- **Text extraction:** `pdf-parse` (Node.js) for narrative content
- **Metadata preservation:** Every extracted chunk retains `document_name`, `page_number`, `section_title`
- **Fallback:** Critical financial tables are manually pre-structured as JSON in `data/tables/`

#### Stage 2: Content Structuring (`lib/pdf/chunker.ts`)

**Narrative content:**
- Split at paragraph/section boundaries
- Target chunk size: 500–800 tokens with 100-token overlap
- Each chunk inherits section header as metadata

**Financial tables (`lib/tables.ts`):**
- Stored as structured JSON with column headers, row labels, values, units
- Searched via keyword matching alongside semantic retrieval
- Not embedded — looked up directly by query keyword at retrieval time

#### Stage 3: Vector Indexing (`scripts/index-vectors.ts`)

- **Embedding model:** Voyage AI `voyage-3-large` — 1024 dimensions
- **Vector store:** Pinecone serverless (free tier)
- **Batch size:** 128 chunks per batch with 200ms rate-limit pause between batches
- **Metadata fields per chunk:**
  - `document_name` (string)
  - `page_number` (int)
  - `section_title` (string)
  - `content_type` (enum: narrative | table | summary)
  - `department` (string, optional)
  - `fiscal_year` (string)

---

## 3. System Architecture

### 3.1 Architecture Pattern

```
User Query
    ↓
Rate Limit Check (Upstash Redis sliding window — 20 req/60s per IP)
    ↓
Query Classification (factual / comparison / explanation / exploratory / out-of-scope)
    ↓
Cache Check (Upstash Redis — skip for follow-up messages)
    ↓ cache miss
Hybrid Retrieval
    ├── Semantic search (Voyage AI → Pinecone) — topK 16, threshold 0.55 / fallback 0.40
    └── Structured lookup (JSON tables) — for factual + comparison queries
    ↓
Reranking + Deduplication (up to 8 chunks assembled)
    ↓
Claude Sonnet 4.5 (full conversation history, max 1500 output tokens)
    ↓
Cited response → cache write (onFinish, TTL 1 week)
    ↓
AI SDK v6 data stream → useChat → Message rendered with citation badges
```

### 3.2 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Framework** | Next.js App Router | 14.2.35 | SSR, built-in API routes, Vercel deployment |
| **UI** | Tailwind CSS + shadcn/ui | 3.4 | Rapid prototyping, design system |
| **Fonts** | Inter + Sora (next/font/google) | — | Inter for body, Sora for headings |
| **AI / LLM** | Claude Sonnet 4.5 (Anthropic) | claude-sonnet-4-5 | Best reasoning for numerical data |
| **AI SDK** | Vercel AI SDK | ai v6.0.103, @ai-sdk/react v3 | Streaming, useChat hook, UIMessage protocol |
| **Embeddings** | Voyage AI voyage-3-large | 1024 dims | High-quality semantic search |
| **Vector Store** | Pinecone serverless | v7.1.0 | Free tier, upsert API |
| **Cache + Rate Limit** | Upstash Redis | @upstash/ratelimit v2 | Serverless Redis, sliding window limiter |
| **PDF Processing** | pdf-parse | v2.4.5 | Text extraction from PDFs |
| **Analytics** | Vercel Analytics | v1.6.1 | Page views, custom click events |
| **Hosting** | Vercel Hobby | — | Zero-config Next.js, global CDN |
| **Repository** | GitHub (synexiom-labs org) | — | Open source, community contributions |

### 3.3 Query Processing Flow (Detailed)

**Step 1 — Rate Limit Check:**
Upstash Redis sliding window. 20 requests per 60 seconds per IP. Returns `429` with `Retry-After: 60` header on violation.

**Step 2 — Query Classification (`lib/rag/retriever.ts`):**
- **Out-of-scope:** Regex patterns (greetings, weather, sports, etc.) → returns polite redirect via stream
- **Factual:** Keywords like "how much", "total", dollar amounts → prioritize structured tables
- **Comparison:** Keywords like "compare", "last year", "increase", "decrease" → pull both years' data
- **Explanation:** Keywords like "why", "explain", "what does" → prioritize narrative chunks
- **Exploratory:** Default — broad retrieval across documents

**Step 3 — Cache Check (`lib/cache.ts`):**
Only for single-turn queries (not follow-ups in active conversations). Cache key: normalized query (lowercase, trimmed, punctuation stripped). TTL: 1 week. Cache reads and writes both enabled.

**Step 4 — Hybrid Retrieval (`lib/rag/retriever.ts`):**
- Voyage AI embedding of query (1024 dims)
- Pinecone query: topK 16, include metadata
- Primary filter: similarity ≥ 0.55, take top 8
- Fallback: if none pass 0.55, take top 3 above 0.40 (prevents "I know nothing" responses for acronyms/specific programs)
- For factual/comparison: merge structured table chunks first (higher priority), then semantic chunks, deduplicated, max 8

**Step 5 — Context Assembly (`lib/rag/reranker.ts`):**
- Keyword-based reranking within retrieved chunks
- Deduplication by chunk ID or content prefix
- Assembled with inline source attribution: `[Document Name, p.XX, Section]`

**Step 6 — LLM Reasoning:**
- `streamText` via `@ai-sdk/anthropic`
- Full `conversationMessages` array passed for multi-turn context
- System prompt: see Section 4.1
- `maxOutputTokens: 1500`
- `onFinish`: writes response to Redis cache

**Step 7 — Response Streaming:**
- `result.toUIMessageStreamResponse()` for live Claude responses
- Manual `ReadableStream` with `d:` + `e:` finish chunks for cached responses and out-of-scope replies
- Client uses `useChat` from `@ai-sdk/react` with `sendMessage({ text })` API
- Citations parsed client-side via regex: `/\[([^\]]+),\s*p\.(\d+)(?:,\s*([^\]]+))?\]/g`

---

## 4. AI Layer Design

### 4.1 System Prompt (`lib/rag/prompts.ts`)

```
You are the NS Budget Chat assistant — a free, open-source tool built by Synexiom Labs
(synexiomlabs.com) that helps Nova Scotians understand their provincial Budget 2026–27.

You are NOT a government tool. You do NOT represent the Province of Nova Scotia. You are
an AI assistant built by Synexiom Labs that reads and interprets publicly available budget
documents. If anyone asks who built you or who made this tool, always say it was built by
Synexiom Labs.

## RULES (non-negotiable)

1. CITE EVERYTHING. Every factual claim must reference [Document Name, p.XX]. If the
   retrieved context does not directly answer the question but contains related information,
   share what you found and note that the specific detail may be in a section not retrieved.
   Only say "I couldn't find this" if the context is entirely unrelated.

2. NEVER FABRICATE NUMBERS. If a figure is not explicitly in the source data, do not infer,
   round, estimate, or calculate it. State that the specific number was not found and suggest
   where the user might look.

3. SHOW YOUR MATH. For comparisons, always show both figures and the change.

4. BE POLITICALLY NEUTRAL. Explain what the numbers say and what they mean. Do not
   editorialize on whether decisions are good or bad.

5. USE PLAIN LANGUAGE. Define jargon when you use it.

6. ACKNOWLEDGE SCOPE. If a question is outside the budget documents, say so.

7. BE CONCISE. Answer the question asked. Offer to go deeper if relevant.

## CONTEXT FROM BUDGET DOCUMENTS
{context}
```

### 4.2 Chunking Strategy (`lib/pdf/chunker.ts`)

| Content Type | Chunk Size | Overlap | Split Boundaries |
|-------------|-----------|---------|-----------------|
| Narrative (Address, Plan) | 500–800 tokens | 100 tokens | Paragraph/section breaks |
| Financial tables | Full table (no split) | N/A | Table boundaries |
| Summary (Highlights) | Full document | N/A | Single chunk |
| Small addenda | Full document | N/A | Single chunk |

### 4.3 Retrieval Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **topK** | 16 | Fetch extra to allow post-filtering |
| **Primary threshold** | 0.55 | Catches specific programs and acronyms |
| **Fallback threshold** | 0.40 | Top 3 — ensures model always has some context |
| **Max chunks returned** | 8 | After deduplication and merge |
| **Table boost** | First position | Structured tables prepended for factual queries |

### 4.4 Response Quality Safeguards

- **Citation requirement:** System prompt mandates `[Document, p.X]` format for every factual claim
- **Anti-hallucination:** Pre-structured JSON tables for key financial figures bypass vector search entirely
- **Never-fabricate rule:** Explicit instruction not to infer, round, or estimate numbers not in source data
- **Scope guard:** Query classifier redirects out-of-scope questions before touching the LLM
- **Confidence signals:** "The budget states" (direct) vs "this suggests" (inference)
- **Test suite:** `scripts/validate.ts` runs ground-truth Q&A pairs — run before each deployment

---

## 5. Frontend Design

### 5.1 Interface Components

**Page Layout (`app/page.tsx`):**
- Dark void header (58px): Synexiom Labs logo + "NS Budget Chat" title (Sora font) + MobileMenu
- Main area: `flex` row — InfoSidebar (desktop) + ChatInterface (flex-1)
- Footer (single row): AI disclaimer + brand links

**InfoSidebar (`components/InfoSidebar.tsx`):**
- Hidden on mobile, 220px on `lg+` screens
- Synexiom Labs logo + link (tracked: `synexiom_click`)
- Open Source GitHub link (tracked: `github_click`)
- Source Documents link (tracked: `source_docs_click`)
- AI disclaimer text
- White background with right border

**MobileMenu (`components/MobileMenu.tsx`):**
- Hidden on `sm+` (replaced by static "Official Budget ↗" link)
- Hamburger button on mobile → dark void dropdown overlay
- Links: Synexiom Labs, Official Budget, Open Source, Source Documents
- All clicks tracked with `location: 'mobile_menu'` property

**ChatInterface (`components/ChatInterface.tsx`):**
- `useChat` hook from `@ai-sdk/react` — messages, sendMessage, status, error
- Welcome hero (pre-first-message): Synexiom logo card, title, tagline, disclaimer badge
- Suggested question cards (6 items, brand blue left-border accent)
- Message list with `msg-appear` fade-up animation
- Loading dots (brand blue, staggered bounce)
- Textarea input with auto-resize (max 160px) + Send button
- Sources panel state: `panelOpen`, `panelSources` — `marginRight: 360px` when open

**MessageBubble (`components/MessageBubble.tsx`):**
- User messages: brand blue bubble (`rgb(26, 58, 143)`), right-aligned, `18px/18px/4px/18px` corners
- Assistant messages: white card bubble with left avatar, `18px/18px/18px/4px` corners
- Citation parsing: regex `/\[([^\]]+),\s*p\.(\d+)(?:,\s*([^\]]+))?\]/g`
- Citation badges (CitationBadge) rendered below bubble
- "📄 N sources found" button triggers SourcesPanel

**SourcesPanel (`components/SourcesPanel.tsx`):**
- Fixed right panel: `top-[58px]` to `bottom-[42px]`, width 360px (full-width on mobile)
- Dark void theme (`rgb(10, 14, 24)`)
- `panelSlide` animation (translateX from right)
- Per-source card: document name, page badge, section, "View in PDF ↗" link
- PDF links from `lib/pdf-urls.ts` with `#page=X` anchors to exact pages

**SuggestedQuestions (`components/SuggestedQuestions.tsx`):**
- 2-column grid on `sm+`, 1-column on mobile
- Cards: white background, `3px solid rgb(26, 58, 143)` left border
- Hover: `#eef2ff` background, `translateY(-1px)` lift, shadow

### 5.2 Design Principles

- **Mobile-first.** MobileMenu on `<sm`, InfoSidebar on `lg+`. SourcesPanel full-width on `<sm`.
- **Streaming UX.** Responses begin rendering token-by-token. Cache hits appear instantly.
- **Accessible.** Semantic HTML, `aria-label` on all interactive controls, keyboard navigation.
- **No layout shift.** Welcome screen and message list share the same flex container — no jarring transitions.
- **Dark header/footer, light chat.** Synexiom void brand framing a clean white/gray chat area.

### 5.3 App Identity

- **Name:** NS Budget Chat
- **Tagline:** "Nova Scotia Budget 2026–27 · Plain Language Guide"
- **Meta title:** `NS Budget Chat — Nova Scotia Budget 2026–27`
- **Meta description:** `Free AI chatbot for exploring the Nova Scotia Budget 2026–27. Ask questions, get cited answers. No signup required.`
- **Favicon:** Synexiom Labs logo (two rounded rectangles + circle) on dark `#06080f` background — `app/icon.svg`
- **Header fonts:** Sora (headings) via `--font-sora`, Inter (body) via `--font-inter`

---

## 6. API & Backend

### 6.1 API Routes

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/chat` | Submit message array, get streamed response | 20 req/min per IP |

### 6.2 `/api/chat` Request/Response

**Request (AI SDK v6 `useChat` format):**
```json
{
  "messages": [
    {
      "id": "msg-abc",
      "role": "user",
      "parts": [{ "type": "text", "text": "What is the healthcare budget?" }]
    }
  ]
}
```

Full `messages` array is sent on every request for multi-turn context. The route extracts the last user message for retrieval, and the full array for conversation history passed to `streamText`.

**Response (AI SDK v6 data stream format):**
```
Content-Type: text/plain; charset=utf-8
x-vercel-ai-data-stream: v1
X-RateLimit-Remaining: 19
X-Cache: HIT  (if served from Redis)

0:"Healthcare spending in Nova Scotia's Budget 2026–27..."\n
d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n
e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n
```

**Important stream protocol detail:** The `useChat` hook in `@ai-sdk/react` v3 requires **both** `d:` (step finish) and `e:` (message finish) chunks to commit a message to state. The `e:` chunk is mandatory — omitting it causes the response to be silently discarded by the client.

### 6.3 Rate Limiting & Cost Control

- **Per-IP rate limiting:** 20 queries/minute sliding window (Upstash Redis)
- **Message length limit:** 1000 characters max input
- **Response token cap:** 1500 output tokens (configurable via `MAX_OUTPUT_TOKENS`)
- **Response caching:** Upstash Redis, 1-week TTL — cached responses bypass Voyage AI, Pinecone, and Claude entirely
- **Cache scope:** Only fresh single-turn queries are cache-checked (not follow-ups in conversations)

### 6.4 Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...       # Claude API — anthropic.com/console
VOYAGE_API_KEY=pa-...               # Voyage AI — dash.voyageai.com
PINECONE_API_KEY=...                # Pinecone — pinecone.io
PINECONE_INDEX=ns-budget-chat       # Your Pinecone index name

# Recommended (rate limiting + caching)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional tuning (with defaults)
RATE_LIMIT_RPM=20                   # Requests per minute per IP
MAX_OUTPUT_TOKENS=1500              # Claude response length cap
CACHE_TTL_HOURS=168                 # Cache lifetime (default: 1 week)
```

### 6.5 Security Headers (`next.config.mjs`)

Applied to all routes via Next.js `headers()` config:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

---

## 7. Repository Structure

```
ns-budget-chat/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Main layout (header + InfoSidebar + ChatInterface + Footer)
│   ├── layout.tsx                 # Root layout with Vercel Analytics + font variables
│   ├── globals.css                # Global styles: animations, scrollbar-hide, font vars
│   ├── icon.svg                   # Favicon — Synexiom Labs logo on dark background
│   └── api/
│       └── chat/route.ts          # Chat endpoint (AI SDK v6 streaming, RAG, cache, rate limit)
├── components/
│   ├── ChatInterface.tsx           # Chat state management, welcome screen, input
│   ├── MessageBubble.tsx           # Message rendering + client-side citation parsing
│   ├── CitationBadge.tsx           # Inline source reference badge
│   ├── SuggestedQuestions.tsx      # Landing state starter question cards
│   ├── SourcesPanel.tsx            # Fixed right panel with PDF source links
│   ├── InfoSidebar.tsx             # Desktop left sidebar: branding + tracked links
│   ├── MobileMenu.tsx              # Mobile hamburger menu with tracked links
│   └── Footer.tsx                  # AI disclaimer + attribution footer
├── lib/
│   ├── rag/
│   │   ├── retriever.ts            # Query classification + hybrid retrieval
│   │   ├── embeddings.ts           # Voyage AI embedding calls (query + batch)
│   │   ├── reranker.ts             # Chunk reranking + context string assembly
│   │   └── prompts.ts              # System prompt template + OUT_OF_SCOPE_RESPONSE
│   ├── pdf/
│   │   ├── extractor.ts            # pdf-parse text extraction
│   │   └── chunker.ts              # Content-aware text chunking
│   ├── cache.ts                    # Upstash Redis response cache (read + write)
│   ├── rate-limit.ts               # Upstash sliding window rate limiter
│   ├── tables.ts                   # Pre-structured financial table keyword lookup
│   ├── pdf-urls.ts                 # Document name → PDF URL + #page anchor mapping
│   └── utils.ts                    # Shared utilities
├── scripts/
│   ├── ingest.ts                   # Download all 6 budget PDFs
│   ├── process.ts                  # Extract text, chunk, structure financial tables
│   ├── index-vectors.ts            # Generate Voyage embeddings + upsert to Pinecone
│   ├── validate.ts                 # Ground-truth accuracy test suite
│   └── test-voyage.ts              # Diagnostic: verify Voyage API key + connectivity
├── public/
│   └── synexiom-logo.svg           # Synexiom Labs logo (transparent background)
├── data/                           # Gitignored at runtime
│   ├── pdfs/                       # Raw downloaded PDFs
│   ├── chunks/                     # Processed text chunks (JSON)
│   ├── tables/                     # Pre-structured financial tables (JSON, committed)
│   └── ground-truth.json           # Validated Q&A pairs for testing
├── types.ts                        # Shared TypeScript types (Chunk, QueryType, etc.)
├── .env.example                    # Environment variable template
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE                         # MIT
├── README.md
├── TECH-SPEC.md                    # This document
├── next.config.mjs                 # Security headers + Next.js config
├── tailwind.config.ts
└── package.json
```

---

## 8. Deployment & Operations

### 8.1 Infrastructure

- **Hosting:** Vercel Hobby (free tier)
- **Domain:** `nsbudget.synexiomlabs.com` — CNAME to `cname.vercel-dns.com`
- **CI/CD:** Vercel auto-deploys from `main` branch. Preview deployments on PRs.
- **Analytics:** Vercel Analytics — page views, unique visitors, referrers, countries, custom click events
- **LLM Monitoring:** Anthropic Console — token usage, cost tracking, error rates
- **Function timeout:** `maxDuration: 30` (verify against your Vercel plan limits)

### 8.2 Cost Estimates (Monthly)

Accurate figures based on actual implementation:

| Service | Per-query | Monthly (1,000 queries, 30% cache hit) |
|---------|----------|---------------------------------------|
| **Claude Sonnet 4.5** | ~$0.016 | ~$11 |
| Voyage AI | ~$0.000001 | <$0.01 (200M free tokens) |
| Pinecone | $0 | $0 (free tier — 100K records, unlimited queries) |
| Upstash Redis | $0 | $0 (10K req/day free — covers ~3,300 queries/day) |
| Vercel | $0 | $0 (Hobby tier) |
| **Total** | **~$0.016** | **~$11** |

Voyage AI is effectively free indefinitely at this query volume. The 200M free token grant covers millions of query embeddings (each query uses ~15 tokens).

### 8.3 Scaling Triggers

- **> 3,300 queries/day:** Upstash Redis free tier exceeded — upgrade to pay-as-you-go (~$0.006 per 100K requests beyond free)
- **> 5,000 queries/month:** Monitor Anthropic spend; caching hit rate should be improving by this point
- **> 20,000 queries/month:** Consider Vercel Pro for better function performance and longer function timeout
- **> 50,000 queries/month:** Good problem. Evaluate community funding, sponsorship, or Anthropic batch API for bulk queries

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Hallucinated numbers** | Critical | Citation mandate in prompt; never-fabricate rule; pre-structured tables for key figures; ground truth test suite |
| **Poor table extraction** | High | Key tables manually pre-structured as JSON in `data/tables/`; vector search for narrative |
| **API cost overrun** | Medium | Rate limiting (20 RPM/IP), response caching (1-week TTL), 1500 token output cap, Anthropic spend alerts |
| **Silent retrieval failure** | Medium | Voyage/Pinecone errors caught and logged; fallback context message sent to Claude rather than crashing |
| **Political misinterpretation** | Medium | Neutral tone enforced in system prompt; disclaimer on every page; no editorializing rule |
| **Cache stream format** | Resolved | `useChat` requires both `d:` and `e:` finish chunks — both present in `streamCachedText` |

---

## 10. Future Roadmap

### Phase 2: Contextual Intelligence (Weeks 2–4)

- Ingest Budget 2025–26 for year-over-year comparison support
- "What changed?" summary mode
- Department-specific deep dives with better metadata filtering
- Improved table extraction coverage

### Phase 3: Reusable Template (Month 2+)

- Abstract budget-specific logic into a configurable template
- Create "budget kit" documentation: how to adapt for any jurisdiction
- GitHub template repository anyone can fork in one click
- Target: any province or municipality can deploy their own version in a few hours

### Phase 4: Platform & Community

- Multilingual support (French) for bilingual accessibility
- API access for third-party integrations
- Municipal budget variants (CBRM, HRM, etc.)
- Community-contributed "context packs" for specific policy areas

---

## 11. Ground Truth Test Questions

These questions (with verified answers) form the accuracy test suite. Run `npm run validate` before each deployment.

```json
[
  {
    "question": "What is the projected deficit for 2026-27?",
    "expected_answer_contains": ["$1.19 billion", "before contingency"],
    "source": "Budget Highlights / Main Budget"
  },
  {
    "question": "What are total revenues for 2026-27?",
    "expected_answer_contains": ["$17.3 billion"],
    "source": "Main Budget"
  },
  {
    "question": "What are total expenses for 2026-27?",
    "expected_answer_contains": ["$18.9 billion"],
    "source": "Main Budget"
  },
  {
    "question": "How much is being spent on healthcare?",
    "expected_answer_contains": ["Health and Wellness"],
    "source": "Estimates"
  },
  {
    "question": "How many FTE positions are being reduced?",
    "expected_answer_contains": ["1,000"],
    "source": "Budget Address"
  },
  {
    "question": "What is the Fiscal Stability Plan?",
    "expected_answer_contains": ["$900 million", "reductions"],
    "source": "Main Budget"
  },
  {
    "question": "How much is being invested in housing?",
    "expected_answer_contains": ["rent supplements", "public housing"],
    "source": "Highlights"
  },
  {
    "question": "What's happening with the Cape Breton Cancer Centre?",
    "expected_answer_contains": ["$1.3 million", "June 2027"],
    "source": "Highlights"
  },
  {
    "question": "How much are school meal programs receiving?",
    "expected_answer_contains": ["$100.4 million"],
    "source": "Highlights"
  },
  {
    "question": "What tax savings does the budget continue?",
    "expected_answer_contains": ["$681.2 million", "$1,400"],
    "source": "Highlights"
  }
]
```

---

*This document reflects the Phase 1 delivered system. Update as implementation evolves.*
