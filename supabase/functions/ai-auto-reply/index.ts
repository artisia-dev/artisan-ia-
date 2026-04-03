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
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messageId, clientMessage } = await req.json();

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('artisan_id, client_id, clients(name)')
      .eq('id', messageId)
      .maybeSingle();

    if (messageError || !message) {
      throw new Error('Message not found');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', message.artisan_id)
      .maybeSingle();

    const businessName = profile?.business_name || 'notre entreprise';

    const autoReply = await generateAutoReplyWithClaude(
      clientMessage,
      businessName,
      message.clients.name,
      anthropicKey
    );

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

async function generateAutoReplyWithClaude(
  clientMessage: string,
  businessName: string,
  clientName: string,
  anthropicKey: string
): Promise<string> {
  const systemPrompt = `Tu es l'assistant IA de ${businessName}, un professionnel artisan. Tu dois répondre aux messages des clients de manière poli, professionnel et en français.

Directives:
- Sois courtois et professionnel
- Sois bref mais utile (2-3 phrases maximum)
- Parle au nom de l'artisan
- Propose de reprendre contact rapidement
- Ne fais pas de promesses que tu ne peux pas tenir
- Sois centré sur les besoins du client`;

  const userPrompt = `Le client "${clientName}" a envoyé ce message:
"${clientMessage}"

Génère une réponse automatique courtoise et professionnelle.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0];

  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  return content.text;
}
