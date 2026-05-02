import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const body = await req.json();

    // ── Mode génération de devis ──────────────────────────────────────────────
    if (body.action === 'generate-quote') {
      const { description } = body;
      if (!description) throw new Error('Description requise');

      const systemPrompt = `Tu es un expert devis pour artisans français.
Génère UNIQUEMENT du JSON valide sans markdown, sans texte avant ou après, sans bloc de code.
Le JSON doit avoir exactement cette structure :
{"title":"...","description":"...","items":[{"description":"...","quantity":1,"unit_price":100}]}

Règles :
- title : court et professionnel (max 8 mots)
- description : 2-3 phrases décrivant le travail
- items : 2 à 5 lignes avec des prix HT réalistes du marché français
- quantity : nombre entier ou décimal
- unit_price : prix en euros, entier ou décimal`;

      const userPrompt = `Génère un devis pour : "${description}"`;

      const reply = await callClaude(systemPrompt, userPrompt, anthropicKey, 1024);

      return new Response(JSON.stringify({ success: true, reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Mode réponse automatique message ─────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messageId, clientMessage } = body;

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('artisan_id, client_id, clients(name)')
      .eq('id', messageId)
      .maybeSingle();

    if (messageError || !message) throw new Error('Message not found');

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', message.artisan_id)
      .maybeSingle();

    const businessName = profile?.business_name || 'notre entreprise';

    const systemPrompt = `Tu es l'assistant IA de ${businessName}, un professionnel artisan. Réponds aux messages clients de façon polie, professionnelle et en français. Sois bref (2-3 phrases max).`;
    const userPrompt = `Le client "${message.clients.name}" a envoyé :\n"${clientMessage}"\n\nGénère une réponse courtoise.`;

    const reply = await callClaude(systemPrompt, userPrompt, anthropicKey, 256);

    const { error: replyError } = await supabase.from('messages').insert([{
      artisan_id:  message.artisan_id,
      client_id:   message.client_id,
      content:     reply,
      sender_type: 'ai',
    }]);

    if (replyError) throw replyError;

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  const content = data?.content;
  if (!content || !content[0] || content[0].type !== 'text') {
    throw new Error('Réponse inattendue de Claude');
  }
  return content[0].text;
}
