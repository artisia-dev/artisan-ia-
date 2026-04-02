import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Send, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  client_id: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      loadMessages(selectedClient);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('artisan_id', user!.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('artisan_id', user!.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          artisan_id: user!.id,
          client_id: selectedClient,
          content: newMessage,
          sender_type: 'artisan',
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedClient);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Communiquez avec vos clients</p>
      </div>

      <div className="bg-white rounded-lg shadow-md h-[calc(100vh-250px)] flex">
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Chargement...</div>
          ) : clients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun client pour le moment
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedClient === client.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="font-semibold text-gray-900">{client.name}</div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {selectedClient ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'artisan' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender_type === 'artisan'
                          ? 'bg-primary-600 text-white'
                          : message.sender_type === 'ai'
                          ? 'bg-accent-100 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.sender_type === 'ai' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot size={16} className="text-accent-600" />
                          <span className="text-xs font-semibold text-accent-600">
                            Réponse automatique
                          </span>
                        </div>
                      )}
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_type === 'artisan'
                            ? 'text-primary-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez un client pour voir les messages
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
