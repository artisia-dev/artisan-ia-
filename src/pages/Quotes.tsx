import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, FileText, Download, Sparkles, X, Loader2, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { generateQuoteLocally } from '../lib/quoteGenerator';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  client_id: string;
  clients: Client;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const EMPTY_FORM = { client_id: '', title: '', description: '', valid_until: '' };
const EMPTY_ITEM: QuoteItem = { description: '', quantity: 1, unit_price: 0, total: 0 };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft:    { label: 'Brouillon', bg: 'bg-gray-100',    text: 'text-gray-700'   },
  sent:     { label: 'Envoyé',    bg: 'bg-blue-100',    text: 'text-blue-700'   },
  accepted: { label: 'Accepté',   bg: 'bg-emerald-100', text: 'text-emerald-700'},
  rejected: { label: 'Refusé',    bg: 'bg-red-100',     text: 'text-red-700'    },
};

export default function Quotes() {
  const { user } = useAuth();
  const [quotes, setQuotes]       = useState<Quote[]>([]);
  const [clients, setClients]     = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [items, setItems]       = useState<QuoteItem[]>([{ ...EMPTY_ITEM }]);

  // ── IA popup state ──
  const [showAIModal, setShowAIModal]       = useState(false);
  const [aiPrompt, setAiPrompt]             = useState('');
  const [aiGenerating, setAiGenerating]     = useState(false);
  const [aiError, setAiError]               = useState('');

  useEffect(() => { if (user) { loadQuotes(); loadClients(); } }, [user]);

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, clients(id, name, email, phone, address)')
        .eq('artisan_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuotes(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients').select('*').eq('artisan_id', user!.id).order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error(e); }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: number | string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    setItems(updated);
  };

  const addItem    = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const total      = () => items.reduce((s, it) => s + it.total, 0);

  // ── IA generation helpers ──
  const applyQuoteData = (title: any, description: any, aiItems: any[]) => {
    setFormData(prev => ({ ...prev, title: title || '', description: description || '' }));
    if (Array.isArray(aiItems) && aiItems.length > 0) {
      setItems(aiItems.map((it: any) => ({
        description: it.description || '',
        quantity:    Number(it.quantity)   || 1,
        unit_price:  Number(it.unit_price) || 0,
        total:       (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      })));
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError('');
    try {
      // Simulation d'un court délai pour l'UX (sensation de "calcul")
      await new Promise(r => setTimeout(r, 800));
      const { title, description, items: aiItems } = generateQuoteLocally(aiPrompt);
      applyQuoteData(title, description, aiItems);
      setShowAIModal(false);
      setAiPrompt('');
      if (!showModal) setShowModal(true);
    } catch (err: any) {
      setAiError(err.message || 'Erreur lors de la génération');
    } finally {
      setAiGenerating(false);
    }
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const quoteNumber = `DEV-${Date.now()}`;
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          artisan_id:  user!.id,
          client_id:   formData.client_id,
          quote_number: quoteNumber,
          title:        formData.title,
          description:  formData.description,
          amount:       total(),
          valid_until:  formData.valid_until,
          status:       'draft',
        }])
        .select().single();
      if (quoteError) throw quoteError;

      const { error: itemsError } = await supabase.from('quote_items').insert(
        items.map(it => ({ quote_id: quoteData.id, ...it }))
      );
      if (itemsError) throw itemsError;

      setShowModal(false);
      setFormData({ ...EMPTY_FORM });
      setItems([{ ...EMPTY_ITEM }]);
      loadQuotes();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ── PDF ──
  const generatePDF = async (quote: Quote) => {
    const { data: itemsData } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id);
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text('DEVIS', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Devis N°: ${quote.quote_number}`, 20, 40);
    doc.text(`Date: ${format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: fr })}`, 20, 50);
    doc.text('Client:', 20, 70); doc.text(quote.clients.name, 20, 78);
    if (quote.clients.address) doc.text(quote.clients.address, 20, 86);
    if (quote.clients.phone)   doc.text(quote.clients.phone, 20, 94);
    doc.text(`Objet: ${quote.title}`, 20, 110);
    let y = 130;
    doc.text('Description', 20, y); doc.text('Qté', 120, y);
    doc.text('P.U.', 145, y); doc.text('Total', 170, y);
    y += 10; doc.line(20, y - 5, 190, y - 5);
    itemsData?.forEach(item => {
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${item.unit_price.toFixed(2)}€`, 145, y);
      doc.text(`${item.total.toFixed(2)}€`, 170, y);
      y += 10;
    });
    doc.line(20, y, 190, y); y += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: ${quote.amount.toFixed(2)}€`, 170, y, { align: 'right' });
    doc.save(`devis-${quote.quote_number}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-500 mt-1">Gérez vos devis professionnels</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAIModal(true); setAiError(''); setAiPrompt(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 transition-all text-sm"
          >
            <Sparkles size={16} />
            Générer avec l'IA
          </button>
          <button
            onClick={() => { setFormData({ ...EMPTY_FORM }); setItems([{ ...EMPTY_ITEM }]); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-accent-500/30 hover:scale-105 transition-all text-sm"
          >
            <Plus size={16} />
            Nouveau devis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 mb-4">Aucun devis pour le moment</p>
          <button
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
          >
            <Sparkles size={15} />
            Créer mon premier devis avec l'IA
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-primary-900 to-indigo-900 text-white">
                {['N° Devis','Client','Titre','Montant','Statut','Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider opacity-80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(quote => {
                const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                return (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono font-medium text-gray-700">{quote.quote_number}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">{quote.clients?.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{quote.title}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{quote.amount.toFixed(2)} €</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => generatePDF(quote)}
                        title="Télécharger le PDF"
                        className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 hover:text-primary-800 transition-colors"
                      >
                        <Download size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════ POPUP IA ═══════════════ */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Wand2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Générer un devis avec l'IA</h2>
                    <p className="text-white/70 text-sm">Décrivez le travail, l'IA s'occupe du reste</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {aiError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Décrivez le travail à effectuer
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ex : réparation fuite robinet salle de bain, installation porte blindée, peinture intérieure salon 20m²…"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition text-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerateWithAI(); }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Plus vous êtes précis, meilleur sera le devis. Ctrl+Entrée pour générer.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-500">
                {[
                  'Remplacement chauffe-eau électrique',
                  'Installation carrelage cuisine 15m²',
                  'Réparation toiture, fuite infiltration',
                  'Électricité : tableau + 10 prises',
                ].map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setAiPrompt(ex)}
                    className="text-left px-3 py-2 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition border border-violet-100"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Génération en cours…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Générer le devis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL DEVIS ═══════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">Créer un devis</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAIModal(true); setShowModal(false); setAiError(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-100 transition border border-violet-200"
                >
                  <Sparkles size={14} />
                  Remplir avec l'IA
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client *</label>
                  <select
                    value={formData.client_id}
                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition bg-white"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de validité *</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Titre du devis *</label>
                  <button
                    type="button"
                    onClick={() => { setShowAIModal(true); setShowModal(false); setAiError(''); }}
                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold transition"
                  >
                    <Sparkles size={12} />
                    Générer avec l'IA
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex : Réparation fuite robinet – Salle de bain"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Détails du travail à réaliser…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Lignes du devis</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-primary-600 hover:text-primary-800 font-semibold transition flex items-center gap-1"
                  >
                    <Plus size={13} /> Ajouter une ligne
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-12 gap-0 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-center">Qté</div>
                    <div className="col-span-2 text-center">P.U. (€)</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-gray-50 transition">
                        <input
                          type="text"
                          placeholder="Description de la prestation"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          className="col-span-5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition"
                          required
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="col-span-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition"
                          min="0" step="0.01" required
                        />
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={e => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="col-span-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition"
                          min="0" step="0.01" required
                        />
                        <div className="col-span-2 text-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg py-1.5">
                          {item.total.toFixed(2)} €
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="col-span-1 flex items-center justify-center text-gray-300 hover:text-red-500 transition disabled:opacity-0"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <span className="text-base font-bold text-gray-900">
                      Total : {total().toFixed(2)} €
                    </span>
                  </div>
                </div>
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-800 to-indigo-800 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : 'Créer le devis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
