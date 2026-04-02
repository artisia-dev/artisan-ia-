import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';

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

export default function Quotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    valid_until: '',
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    if (user) {
      loadQuotes();
      loadClients();
    }
  }, [user]);

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, clients(id, name, email, phone, address)')
        .eq('artisan_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('artisan_id', user!.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const quoteNumber = `DEV-${Date.now()}`;
      const total = calculateTotal();

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert([
          {
            artisan_id: user!.id,
            client_id: formData.client_id,
            quote_number: quoteNumber,
            title: formData.title,
            description: formData.description,
            amount: total,
            valid_until: formData.valid_until,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (quoteError) throw quoteError;

      const itemsToInsert = items.map((item) => ({
        quote_id: quoteData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setShowModal(false);
      setFormData({ client_id: '', title: '', description: '', valid_until: '' });
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
      loadQuotes();
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  const generatePDF = async (quote: Quote) => {
    const { data: itemsData } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('DEVIS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Devis N°: ${quote.quote_number}`, 20, 40);
    doc.text(`Date: ${format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: fr })}`, 20, 50);

    doc.text('Client:', 20, 70);
    doc.text(quote.clients.name, 20, 78);
    if (quote.clients.address) doc.text(quote.clients.address, 20, 86);
    if (quote.clients.phone) doc.text(quote.clients.phone, 20, 94);

    doc.text(`Objet: ${quote.title}`, 20, 110);

    let y = 130;
    doc.text('Description', 20, y);
    doc.text('Qté', 120, y);
    doc.text('P.U.', 145, y);
    doc.text('Total', 170, y);

    y += 10;
    doc.line(20, y - 5, 190, y - 5);

    itemsData?.forEach((item) => {
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${item.unit_price.toFixed(2)}€`, 145, y);
      doc.text(`${item.total.toFixed(2)}€`, 170, y);
      y += 10;
    });

    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: ${quote.amount.toFixed(2)}€`, 170, y, { align: 'right' });

    doc.save(`devis-${quote.quote_number}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyé';
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Refusé';
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-600 mt-2">Gérez vos devis</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau devis
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Aucun devis pour le moment</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Devis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {quote.quote_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.clients.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{quote.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quote.amount.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        quote.status
                      )}`}
                    >
                      {getStatusText(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => generatePDF(quote)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer un devis</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) =>
                      setFormData({ ...formData, client_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de validité
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du devis
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Lignes du devis
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Ajouter une ligne
                  </button>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      className="col-span-5 px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                      }
                      className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="text"
                      value={`${item.total.toFixed(2)}€`}
                      readOnly
                      className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="col-span-1 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div className="text-right mt-4">
                  <span className="text-lg font-bold">
                    Total: {calculateTotal().toFixed(2)}€
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Créer le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
