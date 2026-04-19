import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Stripe from 'stripe'

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: any) {
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
