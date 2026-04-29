import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Users, FileText, Calendar, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';

interface Stats {
  totalClients: number;
  totalQuotes: number;
  appointmentsToday: number;
  pendingQuotes: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalQuotes: 0,
    appointmentsToday: 0,
    pendingQuotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [clientsResult, quotesResult, appointmentsResult, pendingQuotesResult] =
        await Promise.all([
          supabase.from('clients').select('id', { count: 'exact' }).eq('artisan_id', user!.id),
          supabase.from('quotes').select('id', { count: 'exact' }).eq('artisan_id', user!.id),
          supabase
            .from('appointments')
            .select('id', { count: 'exact' })
            .eq('artisan_id', user!.id)
            .gte('start_time', new Date().toISOString().split('T')[0])
            .lt('start_time', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
          supabase
            .from('quotes')
            .select('id', { count: 'exact' })
            .eq('artisan_id', user!.id)
            .eq('status', 'draft'),
        ]);

      setStats({
        totalClients: clientsResult.count || 0,
        totalQuotes: quotesResult.count || 0,
        appointmentsToday: appointmentsResult.count || 0,
        pendingQuotes: pendingQuotesResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Clients',
      value: stats.totalClients,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      hint: 'Total enregistrés',
    },
    {
      name: 'Devis',
      value: stats.totalQuotes,
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      hint: 'Tous statuts confondus',
    },
    {
      name: "Rendez-vous aujourd'hui",
      value: stats.appointmentsToday,
      icon: Calendar,
      gradient: 'from-accent-500 to-rose-500',
      bgGradient: 'from-orange-50 to-rose-50',
      hint: 'Programmés ce jour',
    },
    {
      name: 'Devis en attente',
      value: stats.pendingQuotes,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-fuchsia-600',
      bgGradient: 'from-violet-50 to-fuchsia-50',
      hint: 'Brouillons à finaliser',
    },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();
  const firstName = user?.email?.split('@')[0] || '';

  return (
    <DashboardLayout>
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-20 left-20 w-80 h-80 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium mb-3">
              <Sparkles size={12} className="text-accent-300" />
              <span>Tableau de bord</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-white/70 mt-2">
              Voici un aperçu de votre activité aujourd'hui.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/60">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
            </p>
            <p className="text-2xl font-semibold">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-6 border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white" size={22} />
                  </div>
                  <ArrowUpRight className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" size={18} />
                </div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">{stat.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.hint}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Activité récente</h2>
            <span className="text-xs text-gray-400">En direct</span>
          </div>
          <div className="text-center py-12 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={20} className="text-gray-400" />
            </div>
            <p className="text-sm">Aucune activité récente pour le moment</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Rappels</h2>
            <span className="text-xs text-gray-400">Aujourd'hui</span>
          </div>
          <div className="text-center py-12 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Calendar size={20} className="text-gray-400" />
            </div>
            <p className="text-sm">Aucun rappel pour le moment</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
