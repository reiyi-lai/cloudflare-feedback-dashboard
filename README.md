# Feedback Dashboard

Dashboard meant to aggregate product feedback from various sources – built with Cloudflare Workers, D1 database, and Workers AI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Static Assets  │    │         API Routes              │ │
│  │  (React App)    │    │  /api/feedback - List/filter    │ │
│  │                 │    │  /api/stats - Aggregations      │ │
│  │                 │    │  /api/analyze/:id - AI analysis │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │                         │
           │                         │
    ┌──────▼──────┐          ┌───────▼───────┐
    │     D1      │          │  Workers AI   │
    │  Database   │          │  (Llama 3.1)  │
    │             │          │               │
    │ - feedback  │          │ - Sentiment   │
    │   table     │          │ - Themes      │
    │             │          │ - Urgency     │
    └─────────────┘          └───────────────┘
```

### Cloudflare Products Used

| Product | Purpose | Why This Choice |
|---------|---------|-----------------|
| **Workers** | Hosts API routes and serves static frontend | Serverless, edge-deployed, single deployment for full-stack app |
| **D1 Database** | Stores feedback entries with filtering/aggregation | Native SQL database, perfect for structured data with complex queries |
| **Workers AI** | Sentiment analysis, theme extraction, urgency detection | Built-in ML inference, no external API keys needed, runs on Cloudflare's edge |
| **Static Assets** | Serves the React frontend | Integrated with Workers, automatic asset optimization |

## Prerequisites

- Node.js (v18+)
- npm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with D1 and Workers AI access

## Local Development Setup

### 1. Install dependencies

```bash
# From root
npm install

cd frontend
npm install
```

### 2. Set up D1 Database

```bash
# Create D1 database
npx wrangler d1 create feedback-db

# Run schema to create tables and seed data
npx wrangler d1 execute feedback-db --local --file=schema.sql
```

### 3. Run development servers

```bash
npm run dev

cd frontend
npm run dev
```

View dashboard at `http://localhost:5173`. API runs at `http://localhost:8787`

## Project Structure

```
├── frontend/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── App.tsx     # Main app component
│   │   └── types.ts    # TypeScript types
│   └── package.json
├── src/
│   └── index.ts        # Workers API routes
├── public/             # Built frontend (generated)
├── schema.sql          # D1 database schema
├── wrangler.jsonc      # Cloudflare Workers config
└── package.json        # Workers dependencies
```

## Deployment

```bash
# Run schema on production database
npx wrangler d1 execute feedback-db --remote --file=schema.sql

# Build frontend
cd frontend
npm run build

# Deploy to Cloudflare (from root)
npm run deploy
```
