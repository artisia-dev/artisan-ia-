# ArtisIA

A SaaS platform for French-speaking artisans — an intelligent assistant to manage clients, generate professional quotes (devis), schedule appointments, and automate customer communication using AI.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + PostCSS
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Backend/Auth**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude (via Supabase Edge Functions)
- **Payments**: Stripe (subscription tiers)

## Project Structure

```
├── index.html
├── vite.config.ts          # Vite config (port 5000, host 0.0.0.0, allowedHosts: true)
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Router + layout
│   ├── components/         # Reusable UI (layouts, private routes, Stripe)
│   ├── contexts/           # AuthContext (Supabase session)
│   ├── lib/                # Supabase client
│   ├── pages/              # Dashboard, Landing, Quotes, Appointments, etc.
│   └── index.css
└── supabase/
    ├── functions/          # Deno edge functions (ai-auto-reply)
    └── migrations/         # SQL schema migrations
```

## Development

- **Run**: `npm run dev` — starts Vite on port 5000
- **Build**: `npm run build` (tsc + vite build)
- **Package manager**: npm

## Deployment

- Target: Autoscale (Node.js server)
- Build command: `npm run build`
- Run command: `npm start`
- The production server (`server.js`) serves the built `dist/` folder and handles the Stripe `/api/create-checkout-session` endpoint.

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- Supabase Edge Functions need `ANTHROPIC_API_KEY` set in Supabase dashboard
- Stripe keys configured in Supabase secrets or environment
