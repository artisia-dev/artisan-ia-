import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserPlus,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  X,
  Phone,
  Mail,
  Tag,
  StickyNote,
} from 'lucide-react';

type LeadStatus = 'nouveau' | 'contacté' | 'devis_envoyé' | 'converti' | 'perdu';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  notes: string;
  created_at: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  nouveau: 'Nouveau',
  contacté: 'Contacté',
  devis_envoyé: 'Devis envoyé',
  converti: 'Converti',
  perdu: 'Perdu',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  nouveau: 'bg-blue-100 text-blue-800',
  contacté: 'bg-yellow-100 text-yellow-800',
  devis_envoyé: 'bg-purple-100 text-purple-800',
  converti: 'bg-green-100 text-green-800',
  perdu: 'bg-red-100 text-red-800',
};

const SOURCES = [
  'Bouche à oreille',
  'Site web',
  'Réseaux sociaux',
  'Publicité',
  'Chantier',
  'Autre',
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  source: 'Bouche à oreille',
  status: 'nouveau' as LeadStatus,
  notes: '',
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'tous'>('tous');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadLeads();
  }, [user]);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('artisan_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) setLeads(data);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingLead(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom est requis.');
      return;
    }
    setSaving(true);
    setError('');

    if (editingLead) {
      const { error } = await supabase
        .from('leads')
        .update({ ...form })
        .eq('id', editingLead.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('leads')
        .insert([{ ...form, artisan_id: user!.id }]);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    loadLeads();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return;
    await supabase.from('leads').delete().eq('id', id);
    loadLeads();
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const filtered = filterStatus === 'tous' ? leads : leads.filter((l) => l.status === filterStatus);
  const total = leads.length;
  const nouveaux = leads.filter((l) => l.status === 'nouveau').length;
  const convertis = leads.filter((l) => l.status === 'converti').length;
  const tauxConversion = total > 0 ? Math.round((convertis / total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Suivez vos prospects et clients acquis</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-semibold"
        >
          <Plus size={18} />
          Ajouter un lead
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total leads', value: total, icon: Users, color: 'bg-blue-500' },
          { label: 'Nouveaux', value: nouveaux, icon: UserPlus, color: 'bg-indigo-500' },
          { label: 'Convertis', value: convertis, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Taux de conversion', value: `${tauxConversion}%`, icon: TrendingUp, color: 'bg-accent-500' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-lg shadow-md p-5 flex items-center gap-4">
              <div className={`${s.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-5 border-b flex flex-wrap gap-2">
          {(['tous', 'nouveau', 'contacté', 'devis_envoyé', 'converti', 'perdu'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'tous' ? 'Tous' : STATUS_LABELS[s]}
              <span className="ml-1.5 text-xs opacity-70">
                ({s === 'tous' ? total : leads.filter((l) => l.status === s).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="font-medium">Aucun lead trouvé</p>
            <p className="text-sm mt-1">Ajoutez votre premier lead en cliquant sur le bouton ci-dessus</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((lead) => (
              <div key={lead.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">{lead.name}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {lead.phone && (
                      <span className="flex items-center gap-1"><Phone size={13} />{lead.phone}</span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1"><Mail size={13} />{lead.email}</span>
                    )}
                    {lead.source && (
                      <span className="flex items-center gap-1"><Tag size={13} />{lead.source}</span>
                    )}
                    {lead.notes && (
                      <span className="flex items-center gap-1 truncate max-w-xs"><StickyNote size={13} />{lead.notes}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Ajouté le {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => openEdit(lead)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLead ? 'Modifier le lead' : 'Ajouter un lead'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informations supplémentaires..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
