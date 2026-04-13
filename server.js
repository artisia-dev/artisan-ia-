import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const PLANS = {
  starter: { name: 'Starter', amount: 2900, currency: 'eur' },
  pro: { name: 'Pro', amount: 5900, currency: 'eur' },
  premium: { name: 'Premium', amount: 9900, currency: 'eur' },
};

app.post('/api/create-checkout-session', async (req, res) => {
  const { plan } = req.body;

  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  const origin = req.headers.origin || `https://${process.env.REPLIT_DEV_DOMAIN}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      locale: 'fr',
      line_items: [
        {
          price_data: {
            currency: PLANS[plan].currency,
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

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, 'localhost', () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});
