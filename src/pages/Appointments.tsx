import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Plus, ChevronLeft, ChevronRight, Clock, User,
  CheckCircle2, AlertCircle, XCircle, Calendar, FileText, X
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface Client { id: string; name: string; }

interface Appointment {
  id: string;
  artisan_id: string;
  client_id: string | null;
  title: string;
  date: string;
  time: string;
  status: 'confirmé' | 'en attente' | 'annulé';
  notes: string;
  created_at: string;
  clients: Client | null;
}

const STATUS_CONFIG = {
  'confirmé':   { label: 'Confirmé',   icon: CheckCircle2,  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'en attente': { label: 'En attente', icon: AlertCircle,   bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  'annulé':     { label: 'Annulé',     icon: XCircle,       bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-500'     },
};

const EMPTY_FORM: {
  client_id: string; title: string; date: string;
  time: string; status: 'confirmé' | 'en attente' | 'annulé'; notes: string;
} = {
  client_id: '', title: '', date: format(new Date(), 'yyyy-MM-dd'),
  time: '09:00', status: 'en attente', notes: '',
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients]           = useState<Client[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(new Date());
  const [showModal, setShowModal]       = useState(false);
  const [formData, setFormData]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');

  useEffect(() => { if (user) { loadAll(); } }, [user]);

  const loadAll = async () => {
    await Promise.all([loadAppointments(), loadClients()]);
  };

  const loadAppointments = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end   = format(endOfMonth(currentMonth),   'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select('*, clients(id, name)')
        .eq('artisan_id', user!.id)
        .gte('date', start)
        .lte('date', end)
        .order('date').order('time');
      if (error) throw error;
      setAppointments(data || []);
    } catch (e) { console.error(e); }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients').select('id, name').eq('artisan_id', user!.id).order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error(e); }
  };

  const changeMonth = (dir: 1 | -1) => {
    const next = dir === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(next);
    setSelectedDay(null);
    setTimeout(() => loadAppointments(), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { error } = await supabase.from('appointments').insert([{
        artisan_id: user!.id,
        client_id:  formData.client_id || null,
        title:      formData.title,
        date:       formData.date,
        time:       formData.time,
        status:     formData.status,
        notes:      formData.notes,
      }]);
      if (error) throw error;
      setShowModal(false);
      setFormData({ ...EMPTY_FORM });
      loadAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end:   endOfMonth(currentMonth),
  });
  const firstDayOffset = (getDay(startOfMonth(currentMonth)) + 6) % 7;

  const aptsForDay   = (day: Date) => appointments.filter(a => isSameDay(new Date(a.date + 'T00:00'), day));
  const todayApts    = appointments.filter(a => isSameDay(new Date(a.date + 'T00:00'), new Date()));
  const selectedApts = selectedDay ? aptsForDay(selectedDay) : [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-500 mt-1">Gérez votre planning client</p>
        </div>
        <button
          onClick={() => { setFormData({ ...EMPTY_FORM, date: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : EMPTY_FORM.date }); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-accent-500/30 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Nouveau rendez-vous
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── CALENDRIER ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-900 to-indigo-900">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {daysInMonth.map(day => {
                const dayApts   = aptsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                    className={`relative flex flex-col items-center rounded-xl p-1.5 min-h-[60px] transition-all group
                      ${isToday(day)    ? 'bg-gradient-to-br from-primary-900 to-indigo-900 text-white shadow-md' : ''}
                      ${isSelected && !isToday(day) ? 'bg-accent-50 ring-2 ring-accent-400' : ''}
                      ${!isToday(day) && !isSelected ? 'hover:bg-gray-50' : ''}
                    `}
                  >
                    <span className={`text-sm font-bold mb-1 ${isToday(day) ? 'text-white' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-col gap-0.5 w-full px-0.5">
                      {dayApts.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={`text-[10px] rounded px-1 py-0.5 truncate font-medium leading-tight
                            ${apt.status === 'confirmé'   ? 'bg-emerald-100 text-emerald-800' : ''}
                            ${apt.status === 'en attente' ? 'bg-amber-100 text-amber-800' : ''}
                            ${apt.status === 'annulé'     ? 'bg-red-100 text-red-700 line-through' : ''}
                          `}
                        >
                          {apt.time} {apt.title}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <span className="text-[10px] text-gray-400 font-medium">+{dayApts.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-4 flex gap-4 border-t border-gray-100 pt-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></span>
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── PANNEAU LATÉRAL ── */}
        <div className="flex flex-col gap-4">
          {/* Aujourd'hui */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-rose-500 flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Aujourd'hui</p>
                  <p className="text-sm font-bold text-gray-900">
                    {format(new Date(), 'EEEE d MMM', { locale: fr })}
                  </p>
                </div>
              </div>
              <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                {todayApts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {todayApts.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun rendez-vous aujourd'hui</p>
              ) : todayApts.map(apt => (
                <AptRow key={apt.id} apt={apt} onStatusChange={updateStatus} onDelete={deleteAppointment} />
              ))}
            </div>
          </div>

          {/* Jour sélectionné */}
          {selectedDay && !isToday(selectedDay) && (
            <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-700 to-indigo-700 flex items-center justify-center">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sélectionné</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">
                      {format(selectedDay, 'EEEE d MMM', { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                  {selectedApts.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {selectedApts.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun rendez-vous ce jour</p>
                ) : selectedApts.map(apt => (
                  <AptRow key={apt.id} apt={apt} onStatusChange={updateStatus} onDelete={deleteAppointment} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nouveau rendez-vous</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex : Visite chantier, Installation…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client</label>
                <select
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition bg-white"
                >
                  <option value="">— Sans client lié —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heure *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Statut</label>
                <div className="flex gap-2">
                  {(['en attente', 'confirmé', 'annulé'] as const).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition
                          ${formData.status === s
                            ? `${cfg.bg} ${cfg.text} border-current`
                            : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                          }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Adresse, consignes, matériel…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-800 to-indigo-800 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Créer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function AptRow({
  apt,
  onStatusChange,
  onDelete,
}: {
  apt: Appointment;
  onStatusChange: (id: string, s: Appointment['status']) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[apt.status];
  const Icon = cfg.icon;
  return (
    <div className="px-5 py-3 hover:bg-gray-50 transition group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon size={16} className={`${cfg.text} flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className={`text-sm font-semibold text-gray-900 truncate ${apt.status === 'annulé' ? 'line-through text-gray-400' : ''}`}>
              {apt.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <Clock size={11} />
              <span>{apt.time}</span>
              {apt.clients && (
                <>
                  <span>·</span>
                  <User size={11} />
                  <span className="truncate">{apt.clients.name}</span>
                </>
              )}
            </div>
            {apt.notes && (
              <div className="flex items-start gap-1 mt-1">
                <FileText size={10} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 truncate">{apt.notes}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
          {apt.status !== 'confirmé' && (
            <button
              onClick={() => onStatusChange(apt.id, 'confirmé')}
              title="Confirmer"
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          {apt.status !== 'annulé' && (
            <button
              onClick={() => onStatusChange(apt.id, 'annulé')}
              title="Annuler"
              className="p-1 rounded text-red-500 hover:bg-red-50 transition"
            >
              <XCircle size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(apt.id)}
            title="Supprimer"
            className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    </div>
  );
}
