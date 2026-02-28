# NS Budget Chat

**Understand your provincial budget in plain language.**

A free, open-source AI chatbot for the Nova Scotia Budget 2026–27. Ask questions in plain English, get accurate answers with citations from the official documents. No subscription. No signup.

> *Built so you don't need an AI subscription or a finance degree to understand where your tax dollars are going.*

---

## How It Works

```
Your question
    ↓
Hybrid Retrieval (semantic search + pre-structured financial tables)
    ↓
Context Assembly (ranked, cited, max ~8,000 tokens)
    ↓
Claude Sonnet 4 (reasoning + citation enforcement)
    ↓
Cited answer with source badges
```

- **RAG pipeline** over all six NS Budget 2026–27 documents
- **Pre-structured financial tables** for accurate numerical answers (no hallucinated numbers)
- **Citation mandate** — every factual claim references a source document and page
- **Rate limiting + caching** to keep costs manageable and the service fast

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Anthropic API key
- Voyage AI API key (free tier at voyageai.com)
- Pinecone API key (free serverless tier at pinecone.io)

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

### 3. Ingest budget documents

```bash
# Download all 6 PDFs from Nova Scotia government
npm run ingest

# Extract text, chunk, structure content
npm run process

# Generate embeddings and populate Pinecone
npm run index
```

### 4. Run the app

```bash
npm run dev
# Open http://localhost:3000
```

### 5. (Optional) Validate accuracy

```bash
# Run ground-truth test suite against local server
npm run validate
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/synexiom-labs/ns-budget-chat)

Set the following environment variables in your Vercel project settings:

```
ANTHROPIC_API_KEY
VOYAGE_API_KEY
PINECONE_API_KEY
PINECONE_INDEX
UPSTASH_REDIS_REST_URL      (optional but recommended)
UPSTASH_REDIS_REST_TOKEN    (optional but recommended)
```

> **Note:** Run the ingest pipeline locally first to populate your Pinecone index. The Vercel app reads from Pinecone at query time — it does not process PDFs during deployment.

---

## Adapting for Other Budgets

This project is intentionally generic. To use it for a different budget:

1. **Swap the PDFs** — update `scripts/ingest.ts` with your document URLs
2. **Update doc config** — edit `scripts/process.ts` with your document names and types
3. **Re-structure tables** — update `data/tables/*.json` with your key financial figures
4. **Update ground truth** — edit `data/ground-truth.json` with verified Q&A pairs
5. **Adjust the system prompt** — update `lib/rag/prompts.ts` for your jurisdiction

---

## Project Structure

```
ns-budget-chat/
├── app/               Next.js App Router (pages + API routes)
├── components/        React components (chat UI, citations)
├── lib/
│   ├── rag/           RAG pipeline (retriever, embeddings, reranker, prompts)
│   └── pdf/           PDF extraction and chunking
├── scripts/           Ingest pipeline (ingest → process → index → validate)
├── data/
│   ├── tables/        Pre-structured financial tables (JSON, committed)
│   └── ground-truth.json  Accuracy test cases
└── .env.example       Environment variable template
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome.

Issues labelled `good first issue` are a great starting point.

---

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hosting | $0 (Hobby) |
| Claude Sonnet 4 API | ~$20–60 (1k–3k queries) |
| Voyage AI Embeddings | ~$5–15 |
| Pinecone | $0 (free tier) |
| Upstash Redis | $0 (free tier) |
| **Total** | **~$25–75/mo** |

Response caching significantly reduces API costs for repeated questions.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Created by Meghraj and Ruturaaj Solanki Powered by [Synexiom Labs](https://synexiomlabs.com).*
