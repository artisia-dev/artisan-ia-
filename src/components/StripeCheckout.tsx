import { useState } from 'react';

interface StripeCheckoutProps {
  plan: 'starter' | 'pro' | 'premium';
  label?: string;
  className?: string;
}

export default function StripeCheckout({ plan, label, className }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prices = {
    starter: 29,
    pro: 59,
    premium: 99,
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={className || 'w-full py-3 rounded-lg font-semibold text-center transition-colors bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        {loading ? 'Redirection...' : (label || `Commencer — ${prices[plan]}€/mois`)}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
