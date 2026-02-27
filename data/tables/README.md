# Pre-Structured Financial Tables

These JSON files contain manually structured financial data from the NS Budget 2026-27 documents. They are used by the hybrid retrieval system to provide accurate numerical answers.

## Why Pre-Structured?

PDF table extraction is unreliable for complex government financial tables. Pre-structuring the most critical tables ensures:
- Accurate numbers (no hallucination from column misalignment)
- Instant retrieval (no vector search needed for known figures)
- Verified data (manually checked against source PDFs)

## Files

- `fiscal-summary.json` — Total revenues, expenses, deficit
- `key-investments.json` — Key program investments from Highlights
- `departmental-estimates.json` — Department-by-department spending (add after PDF ingestion)

## Updating

After running `npm run ingest`, verify all figures in these files against the downloaded PDFs and update accordingly.

Run `npm run validate` to confirm key figures are correct before deploying.
