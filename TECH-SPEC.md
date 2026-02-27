# NS Budget Chat — Technical Specification

**Project:** `ns-budget-chat`
**Version:** 1.0 — Phase 1
**Date:** February 2026
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

- **Pre-structured financial tables.** Frontier models are bad at reading complex PDF tables — they misread columns, confuse row labels, hallucinate numbers. We pre-extract and structure key tables into clean JSON, so numerical answers are more accurate than what Claude/GPT produce from raw PDFs.
- **Cross-document linking.** When you upload six PDFs to Claude, it sees separate blobs. Our system pre-links related content — connecting a Highlights bullet to the Estimates table to the Business Plan rationale.
- **Embedded prompt expertise.** The system prompt enforces citation, neutrality, and accuracy standards that every user benefits from, regardless of their AI experience.
- **Shareability.** A URL you can share with 50 colleagues. Not a personal chat session.

**The value proposition in one line:**

> *Built so you don't need an AI subscription or a finance degree to understand where your tax dollars are going.*

### 1.4 Success Criteria (Phase 1)

- Deployed and publicly accessible within 48 hours
- Accurately answers questions about all six budget documents with page-level citations
- Handles 50+ concurrent users without degradation
- All answers include source document and page references
- Open-source repository published and documented for community use
- Anyone can fork this and adapt it for their own government's budget

### 1.5 Open-Source Philosophy

This project is built in the open, for the public. The goal is not to market a brand — it's to build something useful and let the work speak for itself. Specifically:

- **MIT Licensed.** Anyone can use, modify, fork, and distribute. No restrictions.
- **Fully reproducible.** Every step from PDF ingestion to deployment is documented. A developer in New Brunswick or British Columbia should be able to fork this repo and have their own budget chatbot running within hours.
- **No paywalls, no signups, no tracking.** The app doesn't collect personal data, doesn't require accounts, and doesn't gate features.
- **Template by design.** The architecture is deliberately generic — budget-specific logic is separated from the RAG infrastructure so this can become a reusable pattern for any government budget, anywhere.
- **Community contributions welcome.** Phase 2+ features are filed as GitHub Issues with "good first issue" labels. The CONTRIBUTING.md makes it easy for anyone to help improve the tool.

### 1.6 Branding Approach

Subtle. The product is the brand.

- The app header shows the app name: **"NS Budget Chat"**
- The footer reads: `Open Source · Built by Synexiom Labs · GitHub`
- The README credits the creator and context naturally
- No logos in the chat interface, no marketing copy, no calls to action
- People discover who built it by using something good — not by being told

---

## 2. Source Documents

### 2.1 Document Inventory

| Document | Size | Pages | Content Type | Processing Strategy |
|----------|------|-------|--------------|-------------------|
| **Budget 2026–27 (Main)** | 5.7 MB | 73 | Mixed narrative + tables | Dual: tables → structured JSON, narrative → semantic chunks |
| **Budget Address** | 8.12 MB | ~30 | Narrative (speech) | Semantic chunking by topic/section |
| **Estimates & Supplementary Detail** | 10.06 MB | ~200+ | Heavy tables, dept-by-dept | Table extraction → structured JSON with dept metadata |
| **Highlights** | 127 KB | ~4 | Summary bullet points | Full text as single high-priority chunk |
| **Government Business Plan** | 8.41 MB | ~100+ | Mixed strategy + outcomes | Semantic chunking by department/priority area |
| **Additional Appropriations** | 94 KB | ~2 | Small table addendum | Full text as single chunk |

**Source URL:** `https://www.novascotia.ca/documents/budget-documents-2026-2027`

**PDF Download URLs** (to be confirmed/hardcoded in ingest script):
```
https://www.novascotia.ca/sites/default/files/documents/7-4172/budget-2026-27-en.pdf
https://www.novascotia.ca/sites/default/files/documents/.../budget-address-2026-27-en.pdf
https://www.novascotia.ca/sites/default/files/documents/7-4172/budget-estimates-2026-27-en.pdf
https://www.novascotia.ca/sites/default/files/documents/.../budget-highlights-2026-27-en.pdf
https://www.novascotia.ca/sites/default/files/documents/6-4173/ftb-bfi-046-en-budget-2026-2027.pdf
https://www.novascotia.ca/sites/default/files/documents/.../additional-appropriations-2026-27-en.pdf
```

> **Note:** Some URLs may need to be discovered by scraping the budget documents page. The ingest script should attempt to resolve all six documents programmatically.

### 2.2 Document Processing Pipeline

Each document passes through three stages:

#### Stage 1: PDF Extraction

- **Text extraction:** Use `pdf-parse` (Node.js) for narrative content
- **Table extraction:** Use `tabula-py` or `camelot-py` (Python) for financial tables. Budget PDFs have complex multi-level tables that require specialized extraction.
- **Metadata preservation:** Every extracted chunk retains: `document_name`, `page_number`, `section_title`
- **Fallback:** If automated table extraction fails for specific tables, manually structure the 10–15 critical financial summary tables as JSON. This is acceptable for Phase 1.

#### Stage 2: Content Structuring

**Narrative content:**
- Split at paragraph/section boundaries
- Target chunk size: 500–800 tokens with 100-token overlap
- Each chunk inherits its section header hierarchy as metadata
- Preserve formatting cues (bullet lists, emphasis) as they signal importance

**Financial tables:**
- Extract as complete units — never split a table across chunks
- Convert to structured JSON with: column headers, row labels, values, units
- Calculate year-over-year deltas where FY25-26 comparisons exist
- Tag with department name and budget category

**Cross-references:**
- Link Highlights bullets to corresponding Estimates tables
- Link Business Plan outcomes to budget line items
- Store as metadata so retrieval can pull related chunks together

#### Stage 3: Vector Indexing

- **Embedding model:** Voyage AI `voyage-3-large` (preferred) or OpenAI `text-embedding-3-small` (fallback)
- **Vector store:** Pinecone serverless (free tier) — or ChromaDB for fully self-hosted option
- **Metadata fields per chunk:**
  - `document_name` (string)
  - `page_number` (int)
  - `section_title` (string)
  - `content_type` (enum: narrative | table | summary)
  - `department` (string, if applicable)
  - `fiscal_year` (string)

---

## 3. System Architecture

### 3.1 Architecture Pattern

```
User Query
    ↓
Query Classification (factual / comparison / explanation / exploratory)
    ↓
Hybrid Retrieval
    ├── Semantic search (vector store) → narrative context
    └── Structured lookup (JSON tables) → exact numbers
    ↓
Context Assembly (ranked, deduplicated, max ~8,000 tokens)
    ↓
Claude Sonnet 4 (reasoning + synthesis + citation)
    ↓
Cited Response with source badges
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router) | Fast SSR, built-in API routes, Vercel deployment |
| **UI** | Tailwind CSS + shadcn/ui | Rapid prototyping, clean design system |
| **AI / LLM** | Claude Sonnet 4 (Anthropic API) | Best reasoning for numerical data; cost-effective |
| **Embeddings** | Voyage AI or OpenAI | High-quality semantic search |
| **Vector Store** | Pinecone serverless or ChromaDB | Free tier sufficient; self-host option |
| **PDF Processing** | pdf-parse + tabula-py | Text + table extraction |
| **Hosting** | Vercel | Zero-config Next.js, global CDN |
| **Repository** | GitHub (synexiom-labs org) | Open source, community contributions |

### 3.3 Query Processing Flow (Detailed)

**Step 1 — Query Classification:**
Analyze the user's question to determine type:
- **Factual:** "What is the healthcare budget?" → prioritize structured table data
- **Comparison:** "How does education compare to last year?" → retrieve both FY26-27 and FY25-26 data
- **Explanation:** "Why is there a deficit?" → prioritize narrative sections, Budget Address
- **Exploratory:** "What does the budget mean for Cape Breton?" → broad retrieval across documents, regional tags
- **Out of scope:** "What's the weather?" → politely redirect

**Step 2 — Hybrid Retrieval:**
- Run semantic search against vector store (top 8 chunks, threshold ≥ 0.7)
- Simultaneously run structured lookup against indexed tables if query contains dollar amounts, department names, or comparison language
- For factual queries: weight structured data higher (0.7 structured / 0.3 semantic)
- For explanation queries: weight narrative higher (0.3 structured / 0.7 semantic)

**Step 3 — Context Assembly:**
- Rank retrieved chunks by weighted relevance
- Deduplicate overlapping content
- Assemble into context window with clear source attribution per chunk
- Cap at ~8,000 tokens to leave room for LLM reasoning
- Include chunk metadata as inline annotations: `[Source: Estimates, p.42, Health and Wellness]`

**Step 4 — LLM Reasoning:**
- Send assembled context + user query to Claude Sonnet 4
- System prompt enforces citation, accuracy, and neutrality rules (see Section 4)
- Stream response token-by-token for perceived speed

**Step 5 — Response Formatting:**
- Parse Claude's response to extract citation references
- Convert inline citations to clickable citation badges
- Ensure no response is returned without at least one source reference

---

## 4. AI Layer Design

### 4.1 System Prompt

This is the most critical component. It must balance accuracy, context, honesty, and accessibility.

```
You are the NS Budget Chat assistant — a free, open-source tool that helps
Nova Scotians understand their provincial Budget 2026–27.

You are NOT a government tool. You do NOT represent the Province of Nova Scotia.
You are an AI assistant that reads and interprets publicly available budget documents.

## RULES (non-negotiable)

1. CITE EVERYTHING. Every factual claim must reference [Document Name, p.XX].
   If you cannot find supporting evidence, say "I couldn't find this specific
   information in the budget documents" — never guess.

2. NEVER FABRICATE NUMBERS. If a figure is not explicitly in the source data,
   do not infer, round, estimate, or calculate it. State that the specific
   number was not found and suggest where the user might look.

3. SHOW YOUR MATH. For comparisons, always show both figures and the change.
   Example: "Healthcare spending is $6.7B in FY27, up from $5.8B in FY25 —
   an increase of approximately $900M [Estimates, p.XX]."

4. BE POLITICALLY NEUTRAL. Explain what the numbers say and what they mean.
   Do not editorialize on whether decisions are good or bad. Use phrases like
   "the budget allocates" not "the government chose to cut."

5. USE PLAIN LANGUAGE. Define jargon when you use it. "FTE" becomes "full-time
   equivalent positions." "Consolidated entity" becomes "organizations that are
   part of the provincial government's books."

6. ACKNOWLEDGE SCOPE. If a question is outside the budget documents, say so.
   Don't speculate about policy intentions, political motivations, or future
   decisions not documented in the budget.

7. BE CONCISE. Answer the question asked. Offer to go deeper if relevant,
   but don't dump everything you know.

## CONTEXT FROM BUDGET DOCUMENTS
{context}

## USER QUESTION
{query}
```

### 4.2 Chunking Strategy

Budget documents need content-aware chunking, not naive text splitting:

| Content Type | Chunk Size | Overlap | Split Boundaries |
|-------------|-----------|---------|-----------------|
| Narrative (Address, Plan) | 500–800 tokens | 100 tokens | Paragraph/section breaks |
| Financial tables | Full table (no split) | N/A | Table boundaries |
| Summary (Highlights) | Full document | N/A | N/A (single chunk) |
| Small addenda | Full document | N/A | N/A (single chunk) |

### 4.3 Retrieval Parameters

- **Top-K:** 8 chunks per query
- **Similarity threshold:** 0.7 minimum
- **Reranking weights:** semantic similarity (0.6) + metadata relevance (0.4)
- **Table boost:** 1.5x ranking boost for queries containing dollar amounts or department names
- **Cross-document bonus:** If a Highlights chunk is retrieved, also pull the linked Estimates chunk

### 4.4 Response Quality Safeguards

- **Citation requirement:** If Claude cannot cite a source for a claim, it must flag this explicitly
- **Number validation:** For critical financial figures (deficit, total revenue, total expenses), hardcode ground truth values and validate Claude's response against them before displaying
- **Confidence signals:** Encourage Claude to distinguish between "the budget states" (direct quote) and "this suggests" (inference)
- **Hallucination test suite:** Maintain a set of 30+ question-answer pairs with verified correct answers; run as regression test before each deployment

---

## 5. Frontend Design

### 5.1 Interface Components

**Chat Interface:**
- Full-width conversational UI with streaming responses
- Messages render token-by-token for perceived speed
- Markdown rendering for formatted responses (tables, bold, lists)
- Auto-scroll to latest message

**Citation Badges:**
- Each cited source shows as a small badge: `📄 Estimates, p.42`
- Clicking a badge opens a side panel or modal with the source text
- Multiple citations per response are displayed inline

**Suggested Questions (Landing State):**
On first load, show 4–6 curated starters:
- "What is the total deficit for 2026–27?"
- "How much is being invested in healthcare?"
- "What is the Fiscal Stability Plan?"
- "What's happening with public sector jobs?"
- "How much is being spent on housing?"
- "What does this budget mean for education?"

**Disclaimer:**
Persistent, subtle footer text:
> *AI-generated answers based on official budget documents. Always verify against source material. Not affiliated with the Government of Nova Scotia.*

### 5.2 Design Principles

- **Mobile-first.** Most traffic will be mobile. Design for 375px width first.
- **Fast.** First meaningful paint < 1.5s. Streaming response begins < 2s after submission.
- **Accessible.** WCAG 2.1 AA. Proper heading hierarchy, keyboard nav, screen reader support.
- **Clean.** No visual clutter. The chat is the product. White/light background, clear typography.
- **Minimal branding.** App name in header. "Open Source · Built by Synexiom Labs · GitHub" in footer. That's it.

### 5.3 App Identity

- **Name:** NS Budget Chat
- **Tagline:** "Understand your provincial budget in plain language"
- **Footer:** `Open Source · Built by Synexiom Labs · GitHub`
- **Meta description:** "Free AI chatbot for exploring the Nova Scotia Budget 2026–27. Ask questions, get cited answers. No signup required."

---

## 6. API & Backend

### 6.1 API Routes

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/chat` | Submit question, get streamed response | 20 req/min per IP |
| `GET` | `/api/suggestions` | Return curated starter questions | 60 req/min |
| `GET` | `/api/health` | Health check for monitoring | No limit |

### 6.2 `/api/chat` Request/Response

**Request:**
```json
{
  "message": "What is the healthcare budget?",
  "conversation_id": "optional-uuid-for-context"
}
```

**Response (streamed):**
Server-Sent Events (SSE) stream with token-by-token output. Final message includes structured citation metadata:
```json
{
  "content": "The healthcare budget for FY2026-27 is...",
  "citations": [
    {
      "document": "Estimates & Supplementary Detail",
      "page": 42,
      "section": "Health and Wellness",
      "text_snippet": "..."
    }
  ]
}
```

### 6.3 Rate Limiting & Cost Control

- **Per-IP rate limiting:** 20 queries/minute, 200/hour (configurable via env)
- **Response token cap:** 1,500 output tokens max per response
- **Monthly budget alert:** Set Anthropic API alert at $50/month
- **Response caching:** Cache exact-match and semantic-near-match Q&A pairs. Budget data is static, so cached answers remain valid indefinitely.
- **Embedding cache:** Cache query embeddings to avoid re-computing for similar questions

### 6.4 Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...          # Claude API key
EMBEDDING_API_KEY=...                  # Voyage AI or OpenAI key
NEXT_PUBLIC_APP_URL=https://...        # Public URL

# Optional (with defaults)
PINECONE_API_KEY=...                   # If using Pinecone
PINECONE_INDEX=ns-budget-chat          # Index name
RATE_LIMIT_RPM=20                      # Requests per minute per IP
MAX_OUTPUT_TOKENS=1500                 # Response length cap
CACHE_TTL_HOURS=168                    # Cache lifetime (1 week default)
```

---

## 7. Repository Structure

```
ns-budget-chat/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Main chat interface
│   ├── layout.tsx              # Root layout with metadata + footer
│   └── api/
│       ├── chat/route.ts       # Chat endpoint (streaming SSE)
│       ├── suggestions/route.ts
│       └── health/route.ts
├── components/                 # React components
│   ├── ChatInterface.tsx       # Main chat component
│   ├── MessageBubble.tsx       # Individual message with citations
│   ├── CitationBadge.tsx       # Clickable source reference
│   ├── CitationPanel.tsx       # Side panel for source text
│   ├── SuggestedQuestions.tsx   # Landing state starter cards
│   └── Footer.tsx              # Disclaimer + attribution
├── lib/                        # Core logic
│   ├── rag/
│   │   ├── retriever.ts        # Hybrid retrieval (semantic + structured)
│   │   ├── embeddings.ts       # Embedding generation + caching
│   │   ├── reranker.ts         # Result reranking logic
│   │   └── prompts.ts          # System prompt template
│   ├── pdf/
│   │   ├── extractor.ts        # Text extraction from PDFs
│   │   ├── table-extractor.ts  # Financial table extraction
│   │   └── chunker.ts          # Content-aware chunking
│   ├── cache.ts                # Response caching layer
│   └── rate-limit.ts           # IP-based rate limiting
├── scripts/                    # Build & ingest scripts
│   ├── ingest.ts               # Download all budget PDFs
│   ├── process.ts              # Extract, chunk, structure content
│   ├── index.ts                # Build vector index from chunks
│   └── validate.ts             # Run accuracy test suite
├── data/                       # Processed budget data (gitignored except structure)
│   ├── pdfs/                   # Raw downloaded PDFs
│   ├── chunks/                 # Processed text chunks (JSON)
│   ├── tables/                 # Extracted structured tables (JSON)
│   └── ground-truth.json       # Validated Q&A pairs for testing
├── public/                     # Static assets
│   └── og-image.png            # Social share image
├── tests/                      # Test files
│   └── accuracy.test.ts        # Answer quality regression tests
├── .env.example                # Environment variable template
├── .gitignore
├── CONTRIBUTING.md             # How to contribute
├── LICENSE                     # MIT License
├── README.md                   # Setup, usage, architecture overview
├── TECH-SPEC.md                # This document
└── package.json
```

---

## 8. Implementation Timeline (48 Hours)

Single developer using Claude Code for accelerated implementation.

### Day 1: Foundation (Hours 0–12)

| Time | Task | Output | Risk |
|------|------|--------|------|
| **0–1** | Setup GitHub org + repo, scaffold Next.js, connect Vercel | Deployed skeleton | Low |
| **1–4** | Download all 6 PDFs; build extraction pipeline (text + tables) | Processed chunks in `/data` | **Medium** — table extraction |
| **4–6** | Generate embeddings; build and populate vector index | Searchable vector store | Low |
| **6–8** | Build RAG pipeline: retrieval → context assembly → Claude API | Working `/api/chat` | **Medium** — prompt tuning |
| **8–12** | Build chat UI: streaming, citation badges, suggested questions | Functional interface | Low |

### Day 2: Polish & Launch (Hours 12–24)

| Time | Task | Output | Risk |
|------|------|--------|------|
| **12–15** | Test with 30+ real questions; tune prompts and retrieval | Validated accuracy | **High** — answer quality |
| **15–18** | Add rate limiting, caching, error handling, disclaimer | Hardened API | Low |
| **18–20** | Mobile responsiveness, accessibility, final styling | Polished UI | Low |
| **20–22** | Write README, CONTRIBUTING.md, .env.example, this spec | Complete OSS repo | Low |
| **22–24** | Final deployment, custom domain, share for feedback | **Live public tool** | Low |

### Critical Path Risk

The highest-risk task is **PDF table extraction (Hours 1–4).** Budget PDFs have complex multi-level tables that often don't extract cleanly.

**Mitigation:** If automated extraction fails for specific tables, manually structure the ~10–15 critical financial summary tables as JSON. Automate the rest. Acceptable for Phase 1 — accuracy on key numbers matters more than complete automation.

---

## 9. Deployment & Operations

### 9.1 Infrastructure

- **Hosting:** Vercel (Hobby tier for launch; Pro at $20/mo if traffic requires it)
- **Domain:** `budget.synexiom.com` or standalone (to be decided)
- **CI/CD:** Vercel auto-deploys from `main` branch. Preview deployments for PRs.
- **Monitoring:** Vercel Analytics (traffic) + Anthropic Dashboard (API usage/cost)

### 9.2 Cost Estimates (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hosting | $0–$20 | Hobby free; Pro if needed |
| Claude Sonnet 4 API | $20–$60 | ~1,000–3,000 queries at ~$0.02/query |
| Embedding API | $5–$15 | Per-query embedding generation |
| Pinecone | $0 | Free tier covers this volume |
| Domain | $0–$15/yr | Subdomain of existing domain is free |
| **Total** | **$25–$95/mo** | Caching significantly reduces API costs |

### 9.3 Scaling Triggers

- **> 5,000 queries/month:** Upgrade Vercel to Pro, increase cache aggressiveness
- **> 15,000 queries/month:** Consider dedicated embedding cache (Redis), evaluate Anthropic batch API
- **> 50,000 queries/month:** This is a good problem. Explore sponsorship or community funding.

---

## 10. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Hallucinated numbers** | Critical | Citation mandate in prompt; never-fabricate rule; ground truth validation; regression test suite |
| **Poor table extraction** | High | Manual structuring of critical tables as fallback; validate against source PDFs |
| **API cost overrun** | Medium | Rate limiting, response caching, spending alerts, token caps |
| **Political misinterpretation** | Medium | Neutral tone in prompt; disclaimer; no editorializing |
| **Budget window closes** | Medium | 48-hour timeline; ship functional Phase 1, iterate on quality |
| **Low adoption** | Low | Share through existing networks; open source community; useful product finds users |

---

## 11. Future Roadmap

### Phase 2: Contextual Intelligence (Week 2–3)
- Ingest Budget 2025–26 for year-over-year comparisons
- Add news coverage context for media interpretation
- Department-specific deep dives
- "What changed?" summary mode showing key differences from last year

### Phase 3: Reusable Template (Month 2+)
- Abstract budget-specific logic into configurable template
- Create "budget kit" documentation: how to ingest any government budget
- Publish as a GitHub template repository anyone can fork
- Target: any province or municipality can deploy their own version

### Phase 4: Platform & Community
- Multilingual support (French) for bilingual accessibility
- API access for third-party developers
- Community-contributed "context packs" for different policy areas
- Municipal budget variants (CBRM, HRM, etc.)

---

## 12. Ground Truth Test Questions

These questions (with verified answers) form the accuracy test suite. Each must be validated against source documents before launch.

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
    "source": "Budget Address / News releases"
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
    "source": "News release / Highlights"
  }
]
```

Add more questions during testing (target 30+). Run `scripts/validate.ts` before every deployment.

---

## 13. README Outline

The README.md should cover:

1. **Hero section** — App name, one-line description, screenshot
2. **"Built so you don't need an AI subscription or a finance degree to understand where your tax dollars are going."**
3. **Quick start** — Clone, configure `.env`, run `npm run ingest`, `npm run dev`
4. **How it works** — Brief architecture (1 paragraph + diagram)
5. **Deploying your own** — Vercel one-click deploy button
6. **Adapting for other budgets** — How to point this at different PDFs
7. **Contributing** — Link to CONTRIBUTING.md
8. **License** — MIT
9. **Footer** — "Created by Meghrajsinh Solanki. Powered by Synexiom Labs."

---

*This is a living document. Update as implementation decisions are made.*
