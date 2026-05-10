import { Link } from 'react-router-dom';
import { Check, MessageSquare, FileText, Calendar, BarChart3, Zap, Sparkles, ArrowRight, Star, Hammer } from 'lucide-react';
import StripeCheckout from '../components/StripeCheckout';

export default function Landing() {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      tagline: 'Pour démarrer sereinement',
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
      tagline: 'Le choix des artisans qui grandissent',
      features: [
        'Jusqu\'à 200 clients',
        'Messagerie intelligente',
        'Génération de devis par IA',
        'Calendrier de rendez-vous',
        'Statistiques avancées',
        'Réponses IA personnalisées',
        'Support prioritaire',
      ],
    },
    {
      name: 'Premium',
      price: '99',
      tagline: 'Tout l\'arsenal, sans limite',
      features: [
        'Clients illimités',
        'Messagerie intelligente',
        'Génération de devis par IA',
        'Calendrier de rendez-vous',
        'Statistiques avancées',
        'Réponses IA personnalisées',
        'Support prioritaire',
        'Formation personnalisée',
        'API personnalisée',
      ],
    },
  ];

  const features = [
    { icon: MessageSquare, title: 'Messagerie intelligente', desc: 'L\'IA répond à vos clients 24/7 avec votre ton et votre expertise.', gradient: 'from-orange-400 to-rose-500' },
    { icon: FileText, title: 'Devis professionnels', desc: 'Créez et envoyez des devis PDF en moins de deux minutes.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Calendar, title: 'Calendrier intelligent', desc: 'Vos rendez-vous, rappels et disponibilités, toujours synchronisés.', gradient: 'from-emerald-500 to-teal-600' },
    { icon: BarChart3, title: 'Statistiques en temps réel', desc: 'Pilotez votre activité avec des indicateurs clairs et actionnables.', gradient: 'from-violet-500 to-fuchsia-600' },
    { icon: Zap, title: 'Automatisation totale', desc: 'Reprenez vos soirées : l\'admin se gère tout seul.', gradient: 'from-amber-400 to-orange-500' },
    { icon: Hammer, title: 'Pensé pour vous', desc: 'Une interface conçue avec et pour les artisans, pas pour les geeks.', gradient: 'from-sky-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="absolute top-0 left-0 right-0 z-20">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-rose-500 flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ArtisIA</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline px-5 py-2 text-white/90 hover:text-white text-sm font-medium transition"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-white text-primary-900 rounded-full text-sm font-semibold hover:bg-accent-50 transition shadow-lg"
            >
              Essayer gratuitement
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 pt-32 pb-32">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent_60%)]"></div>

        <div className="relative container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
            <Sparkles size={14} className="text-accent-400" />
            <span>Propulsé par l'intelligence artificielle</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.05]">
            Ne perdez plus jamais
            <span className="block bg-gradient-to-r from-accent-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
              un client.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            ArtisIA est l'assistant intelligent qui gère vos messages, devis et rendez-vous
            automatiquement. Concentrez-vous sur votre métier — on s'occupe du reste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-500 to-rose-500 text-white text-base font-semibold rounded-full hover:shadow-2xl hover:shadow-accent-500/40 hover:scale-105 transition-all duration-200"
            >
              Commencer maintenant
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#tarifs"
              className="px-8 py-4 text-white/90 hover:text-white text-base font-medium transition"
            >
              Voir les tarifs →
            </a>
          </div>

          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-accent-400 text-accent-400" />)}
              </div>
              <span>4.9/5 par les artisans</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20"></div>
            <span>14 jours d'essai gratuit</span>
            <div className="hidden sm:block w-px h-4 bg-white/20"></div>
            <span>Sans engagement</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white"></div>
      </section>

      <section className="relative py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold uppercase tracking-wider mb-4">
              Fonctionnalités
            </span>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Tout ce dont vous avez besoin
            </h3>
            <p className="text-gray-600 text-lg">
              Une suite complète, pensée pour les artisans qui veulent gagner du temps sans renoncer à la qualité.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative bg-white p-8 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white" size={26} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="tarifs" className="relative py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-900 text-xs font-semibold uppercase tracking-wider mb-4">
              Tarifs
            </span>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Choisissez votre formule
            </h3>
            <p className="text-gray-600 text-lg">
              Tous les plans incluent 14 jours d'essai gratuit. Sans engagement, annulable à tout moment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-primary-900 to-indigo-900 text-white shadow-2xl shadow-primary-900/30 lg:scale-105'
                    : 'bg-white border border-gray-200 hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-accent-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-accent-500/40">
                      <Sparkles size={12} />
                      Le plus populaire
                    </span>
                  </div>
                )}
                <h4 className={`text-2xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h4>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                  {plan.tagline}
                </p>
                <div className="mb-8">
                  <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}€
                  </span>
                  <span className={plan.popular ? 'text-white/60' : 'text-gray-500'}>/mois</span>
                </div>
                <StripeCheckout
                  plan={plan.name.toLowerCase() as 'starter' | 'pro' | 'premium'}
                  label="Commencer"
                  className={`block w-full py-3.5 rounded-xl font-semibold text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-gradient-to-r from-accent-500 to-rose-500 text-white hover:shadow-xl hover:shadow-accent-500/40'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                />
                <ul className="space-y-3 mt-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.popular ? 'bg-accent-500/20' : 'bg-accent-100'}`}>
                        <Check className={plan.popular ? 'text-accent-300' : 'text-accent-600'} size={12} strokeWidth={3} />
                      </div>
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à reprendre le contrôle de votre activité ?
          </h3>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Rejoignez les artisans qui ont libéré des heures chaque semaine grâce à ArtisIA.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-900 text-base font-semibold rounded-full hover:scale-105 hover:shadow-2xl transition-all duration-200"
          >
            Démarrer mon essai gratuit
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-950 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-rose-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">ArtisIA</h2>
          </div>
          <p className="text-white/50 text-sm">
            L'assistant intelligent pour les artisans · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
