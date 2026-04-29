import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Calendar,
  Settings,
  LogOut,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: UserPlus },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Devis', href: '/quotes', icon: FileText },
    { name: 'Rendez-vous', href: '/appointments', icon: Calendar },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initial = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex">
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-indigo-900 text-white flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-rose-500 flex items-center justify-center shadow-lg shadow-accent-500/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">ArtisIA</h1>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-accent-400 to-rose-500 rounded-r-full" />
                  )}
                  <Icon size={18} className={isActive ? 'text-accent-400' : ''} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-8 py-3 flex items-center justify-end gap-4">
            <NotificationBell />
            <div className="w-px h-7 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-700 to-indigo-700 text-white text-sm font-semibold flex items-center justify-center">
                {initial}
              </div>
              <div className="text-sm text-gray-700 font-medium hidden sm:block">
                {user?.email}
              </div>
            </div>
          </header>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
