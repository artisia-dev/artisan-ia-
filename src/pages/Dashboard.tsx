import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Users, FileText, Calendar, TrendingUp } from 'lucide-react';

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
      color: 'bg-blue-500',
    },
    {
      name: 'Devis',
      value: stats.totalQuotes,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: "Rendez-vous aujourd'hui",
      value: stats.appointmentsToday,
      icon: Calendar,
      color: 'bg-accent-500',
    },
    {
      name: 'Devis en attente',
      value: stats.pendingQuotes,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Bienvenue sur votre espace ArtisIA</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activité récente</h2>
          <p className="text-gray-600">Aucune activité récente pour le moment</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rappels</h2>
          <p className="text-gray-600">Aucun rappel pour le moment</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
