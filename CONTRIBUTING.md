# Contributing to NS Budget Chat

Thank you for your interest in contributing. This project is open source and built for the public good.

## Ways to Contribute

- **Bug reports** — Open an issue with steps to reproduce
- **Answer quality improvements** — If the chatbot gives an inaccurate or unhelpful answer, open an issue with the question and what a better answer would look like
- **Ground truth expansion** — Add more verified Q&A pairs to `data/ground-truth.json`
- **Table structuring** — Manually structure financial tables from the Estimates PDF into `data/tables/`
- **Code improvements** — See issues labelled `good first issue`
- **Documentation** — Improve the README, add examples, fix typos

## Development Setup

See the [README](README.md) Quick Start section.

## Pull Request Process

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run the validate script: `npm run validate` (requires dev server running)
5. Open a pull request with a clear description of what changed and why

## Code Style

- TypeScript throughout (no `any` unless unavoidable)
- `npm run lint` must pass before merging
- Keep components small and focused
- New API behaviour should have test cases in `data/ground-truth.json`

## Accuracy Standards

This tool is used by real people to understand real government spending. Accuracy matters.

- Never lower the citation threshold in `lib/rag/retriever.ts` without evidence it improves accuracy
- Any change to the system prompt (`lib/rag/prompts.ts`) should be tested against the full ground truth suite
- Financial figures must be verifiable against source PDFs before being added to `data/tables/`

## Code of Conduct

Be constructive. Assume good faith. Focus on the work.
