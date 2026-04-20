import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, FileText, UserPlus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  icon: typeof Bell;
  iconColor: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem(`notif_read_${user?.id}`);
    if (stored) setReadIds(new Set(JSON.parse(stored)));
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const results = await Promise.allSettled([
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('artisan_id', user!.id)
        .gte('start_time', today)
        .lt('start_time', tomorrow),
      supabase
        .from('quotes')
        .select('id', { count: 'exact' })
        .eq('artisan_id', user!.id)
        .eq('status', 'draft'),
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('artisan_id', user!.id)
        .gte('created_at', weekAgo)
        .eq('status', 'nouveau'),
    ]);

    const notifs: Notification[] = [];

    const apptResult = results[0];
    if (apptResult.status === 'fulfilled' && !apptResult.value.error) {
      const count = apptResult.value.count ?? 0;
      if (count > 0) {
        notifs.push({
          id: 'appt_today',
          icon: Calendar,
          iconColor: 'text-accent-600 bg-accent-50',
          title: count === 1 ? '1 rendez-vous aujourd\'hui' : `${count} rendez-vous aujourd'hui`,
          description: 'Consultez votre planning du jour',
          href: '/appointments',
          read: false,
        });
      }
    }

    const quotesResult = results[1];
    if (quotesResult.status === 'fulfilled' && !quotesResult.value.error) {
      const count = quotesResult.value.count ?? 0;
      if (count > 0) {
        notifs.push({
          id: 'quotes_pending',
          icon: FileText,
          iconColor: 'text-purple-600 bg-purple-50',
          title: count === 1 ? '1 devis en attente' : `${count} devis en attente`,
          description: 'Des devis sont encore au statut brouillon',
          href: '/quotes',
          read: false,
        });
      }
    }

    const leadsResult = results[2];
    if (leadsResult.status === 'fulfilled' && !leadsResult.value.error) {
      const count = leadsResult.value.count ?? 0;
      if (count > 0) {
        notifs.push({
          id: 'leads_new',
          icon: UserPlus,
          iconColor: 'text-blue-600 bg-blue-50',
          title: count === 1 ? '1 nouveau lead cette semaine' : `${count} nouveaux leads cette semaine`,
          description: 'Des prospects non encore contactés vous attendent',
          href: '/leads',
          read: false,
        });
      }
    }

    if (notifs.length === 0) {
      notifs.push({
        id: 'all_good',
        icon: Bell,
        iconColor: 'text-green-600 bg-green-50',
        title: 'Tout est à jour !',
        description: 'Aucune action requise pour le moment',
        href: '/dashboard',
        read: true,
      });
    }

    setNotifications(notifs);
  };

  const markAllRead = () => {
    const ids = new Set(notifications.map((n) => n.id));
    setReadIds(ids);
    localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify([...ids]));
  };

  const handleClick = (notif: Notification) => {
    const newIds = new Set([...readIds, notif.id]);
    setReadIds(newIds);
    localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify([...newIds]));
    setOpen(false);
    navigate(notif.href);
  };

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-accent-600 hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="divide-y max-h-80 overflow-y-auto">
            {notifications.map((notif) => {
              const Icon = notif.icon;
              const isRead = readIds.has(notif.id);
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                    !isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${notif.iconColor}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.description}</p>
                  </div>
                  {!isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t text-center">
            <span className="text-xs text-gray-400">Mis à jour à l'ouverture</span>
          </div>
        </div>
      )}
    </div>
  );
}
