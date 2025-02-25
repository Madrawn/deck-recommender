# Hearthstone Deck Evaluator

An AI-powered tool for analyzing Hearthstone decks, providing card recommendations and strategic insights using Next.js and real-time streaming updates.

## Features

- **Deck Code Analysis**: Parse and validate Hearthstone deck codes
- **Real-time AI Evaluation**: Streaming analysis using SSE (Server-Sent Events)
- **Card Metadata Enrichment**: Automatic card data fetching from Hearthstone wiki
- **Interactive UI**: Visual mana curve analysis and card statistics
- **Error Handling**: Robust error recovery and loading states
- **Caching**: 1-hour cache for card data requests

## Tech Stack

- **Framework**: Next.js (App Router)
- **Streaming**: Custom SSE implementation
- **Data Fetching**: 
  - Wiki.gg API scraping
  - Next.js unstable_cache for caching
- **UI**: 
  - React Markdown for AI response rendering
  - Responsive grid layout
  - Interactive modals

## Installation

```bash
npm install
npm run dev
```

## Configuration

Environment variables (create `.env.local`):
```env
# Optional: Add any required API keys if expanding functionality
```

## Running Locally

1. Start development server:
```bash
npm run dev
```
2. Open http://localhost:3000
3. Paste a Hearthstone deck code in the format:
```
### Deck Name
# Class: Mage
# Format: Standard
#
# 2x (1) Arcane Missiles
# 1x (3) Frost Nova
...
```

## Architecture Highlights

### Streaming Workflow
1. Client submits deck code
2. Server processes cards in parallel
3. Real-time updates via SSE:
   - Card metadata updates
   - Error events
   - Final analysis package
4. AI prompt generation with mana curve analysis

### Key Files
- `app/page.tsx`: Main evaluation interface
- `app/api/deck-eval/route.ts`: SSE streaming endpoint
- `app/lib/sse`: Custom SSE utilities
- `app/promptGen.ts`: Card data processing and prompt generation

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit PR with:
   - Code changes
   - Updated tests
   - Documentation updates

## License

MIT License (see repository for details)
