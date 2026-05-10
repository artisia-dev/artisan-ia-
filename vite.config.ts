import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Stripe from 'stripe'

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: any) {

      // ── Génération de devis IA ─────────────────────────────────────────────
      server.middlewares.use('/api/generate-quote', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { description } = JSON.parse(body);
            if (!description) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Description requise' }));
              return;
            }

            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            if (!anthropicKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Clé ANTHROPIC_API_KEY manquante' }));
              return;
            }

            const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-opus-4-5',
                max_tokens: 1024,
                system: `Tu es un expert devis pour artisans français.
Génère UNIQUEMENT du JSON valide sans markdown, sans texte avant ou après.
Structure exacte requise :
{"title":"...","description":"...","items":[{"description":"...","quantity":1,"unit_price":100}]}
Règles :
- title : court et professionnel (max 8 mots)
- description : 2-3 phrases décrivant le travail
- items : 2 à 5 lignes avec prix HT réalistes du marché français
- quantity : nombre entier ou décimal
- unit_price : prix en euros HT`,
                messages: [{ role: 'user', content: `Génère un devis pour : "${description}"` }],
              }),
            });

            if (!anthropicRes.ok) {
              const errText = await anthropicRes.text();
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Anthropic API error: ${errText}` }));
              return;
            }

            const data = await anthropicRes.json();
            const text = data?.content?.[0]?.text;
            if (!text) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Réponse vide de Claude' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply: text }));
          } catch (err: any) {
            console.error('[generate-quote] Erreur:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // ── Paiement Stripe ────────────────────────────────────────────────────
      server.middlewares.use('/api/create-checkout-session', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { plan } = JSON.parse(body);

            const PLANS: Record<string, { name: string; amount: number }> = {
              starter: { name: 'Starter', amount: 2900 },
              pro: { name: 'Pro', amount: 5900 },
              premium: { name: 'Premium', amount: 9900 },
            };

            if (!PLANS[plan]) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Plan invalide' }));
              return;
            }

            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            const host = req.headers.host || '';
            const protocol = host.includes('replit') ? 'https' : 'http';
            const origin = `${protocol}://${host}`;

            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              mode: 'subscription',
              locale: 'fr',
              line_items: [
                {
                  price_data: {
                    currency: 'eur',
                    product_data: {
                      name: `ArtisIA ${PLANS[plan].name}`,
                      description: `Abonnement mensuel ArtisIA ${PLANS[plan].name}`,
                    },
                    unit_amount: PLANS[plan].amount,
                    recurring: { interval: 'month' },
                  },
                  quantity: 1,
                },
              ],
              success_url: `${origin}/paiement-reussi?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${origin}/?annule=1`,
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: session.url }));
          } catch (err: any) {
            console.error('Stripe error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
})
