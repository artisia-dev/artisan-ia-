import { Link } from 'react-router-dom';
import { Check, MessageSquare, FileText, Calendar, BarChart3, Zap } from 'lucide-react';
import StripeCheckout from '../components/StripeCheckout';

export default function Landing() {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      features: [
        'Jusqu\'à 50 clients',
        'Messagerie intelligente',
        'Devis illimités',
        'Calendrier de rendez-vous',
        'Statistiques de base',
      ],
    },
    {
      name: 'Pro',
      price: '59',
      popular: true,
      features: [
        'Jusqu\'à 200 clients',
        'Messagerie intelligente',
        'Devis illimités',
        'Calendrier de rendez-vous',
        'Statistiques avancées',
        'Réponses IA personnalisées',
        'Support prioritaire',
      ],
    },
    {
      name: 'Premium',
      price: '99',
      features: [
        'Clients illimités',
        'Messagerie intelligente',
        'Devis illimités',
        'Calendrier de rendez-vous',
        'Statistiques avancées',
        'Réponses IA personnalisées',
        'Support prioritaire',
        'Formation personnalisée',
        'API personnalisée',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary-900 text-white">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">ArtisIA</h1>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-6 py-2 rounded-lg hover:bg-primary-800 transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors"
            >
              Essayer gratuitement
            </Link>
          </div>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Ne perdez plus jamais un client
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          ArtisIA est l'assistant intelligent qui gère vos messages, devis et rendez-vous
          automatiquement. Concentrez-vous sur votre métier, on s'occupe du reste.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-4 bg-accent-600 text-white text-lg font-semibold rounded-lg hover:bg-accent-700 transition-colors"
        >
          Commencer maintenant
        </Link>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Tout ce dont vous avez besoin
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <MessageSquare className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Messagerie intelligente</h4>
              <p className="text-gray-600">
                L'IA répond automatiquement à vos clients 24/7
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <FileText className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Devis professionnels</h4>
              <p className="text-gray-600">
                Créez et envoyez des devis en PDF en quelques clics
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <Calendar className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Calendrier intelligent</h4>
              <p className="text-gray-600">
                Gérez vos rendez-vous avec notifications automatiques
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <BarChart3 className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Statistiques en temps réel</h4>
              <p className="text-gray-600">
                Suivez vos performances et votre activité
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <Zap className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Automatisation totale</h4>
              <p className="text-gray-600">
                Gagnez du temps sur les tâches administratives
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <Check className="text-accent-600 mb-4" size={40} />
              <h4 className="text-xl font-bold mb-2">Simple et efficace</h4>
              <p className="text-gray-600">
                Interface conçue pour les artisans, pas les experts tech
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Choisissez votre formule
          </h3>
          <p className="text-center text-gray-600 mb-16">
            Tous les plans incluent 14 jours d'essai gratuit
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-lg shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-accent-600 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-accent-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Le plus populaire
                    </span>
                  </div>
                )}
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h4>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="text-accent-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <StripeCheckout
                  plan={plan.name.toLowerCase() as 'starter' | 'pro' | 'premium'}
                  label="Commencer"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-accent-600 text-white hover:bg-accent-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-primary-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">ArtisIA</h2>
          <p className="text-primary-100">
            L'assistant intelligent pour les artisans
          </p>
        </div>
      </footer>
    </div>
  );
}
