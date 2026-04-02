import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messageId, clientMessage } = await req.json();

    const autoReply = generateAutoReply(clientMessage);

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('artisan_id, client_id')
      .eq('id', messageId)
      .maybeSingle();

    if (messageError || !message) {
      throw new Error('Message not found');
    }

    const { error: replyError } = await supabase.from('messages').insert([
      {
        artisan_id: message.artisan_id,
        client_id: message.client_id,
        content: autoReply,
        sender_type: 'ai',
        is_read: false,
      },
    ]);

    if (replyError) throw replyError;

    return new Response(
      JSON.stringify({ success: true, reply: autoReply }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateAutoReply(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('devis') || lowerMessage.includes('prix')) {
    return 'Bonjour ! Merci pour votre message. Je serais ravi de vous établir un devis personnalisé. Je reviens vers vous très rapidement avec une proposition adaptée à vos besoins.';
  }

  if (lowerMessage.includes('rendez-vous') || lowerMessage.includes('rdv')) {
    return 'Bonjour ! Merci de votre intérêt. Je vous propose de prendre rendez-vous pour discuter de votre projet. Je vous contacte dans les plus brefs délais pour convenir d\'un créneau.';
  }

  if (lowerMessage.includes('disponible') || lowerMessage.includes('disponibilité')) {
    return 'Bonjour ! Merci pour votre message. Je consulte mon agenda et je vous confirme mes disponibilités rapidement.';
  }

  if (lowerMessage.includes('urgent') || lowerMessage.includes('rapidement')) {
    return 'Bonjour ! J\'ai bien reçu votre message urgent. Je vous recontacte dans les plus brefs délais pour traiter votre demande en priorité.';
  }

  return 'Bonjour ! Merci pour votre message. Je l\'ai bien reçu et je vous réponds très rapidement. À bientôt !';
}
