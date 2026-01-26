# Feedback Dashboard

Dashboard meant to aggregate product feedback from various sources – built with Cloudflare Workers, D1 database, and Workers AI.

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
# Build frontend
cd frontend
npm run build

# Deploy to Cloudflare (from root)
npm run deploy

# Run schema on production database (first time only)
npx wrangler d1 execute feedback-db --remote --file=schema.sql
```
