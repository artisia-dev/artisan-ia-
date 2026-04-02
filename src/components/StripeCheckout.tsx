import { useState } from 'react';

interface StripeCheckoutProps {
  plan: 'starter' | 'pro' | 'premium';
  onSuccess?: () => void;
}

export default function StripeCheckout({ plan, onSuccess }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const prices = {
    starter: { amount: 29, priceId: 'price_starter' },
    pro: { amount: 59, priceId: 'price_pro' },
    premium: { amount: 99, priceId: 'price_premium' },
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      console.log('Stripe checkout for plan:', plan);
      console.log('Price:', prices[plan].amount, '€');

      alert('Intégration Stripe : Veuillez configurer votre clé Stripe pour activer les paiements. Consultez https://bolt.new/setup/stripe pour plus d\'informations.');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Chargement...' : `S'abonner - ${prices[plan].amount}€/mois`}
    </button>
  );
}
