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

      const systemPrompt = `Tu es un assistant expert pour les artisans français.
Quand on te décrit un travail, tu génères un devis structuré en JSON.

Règles:
- Titre court et professionnel (max 8 mots)
- Description claire du travail à effectuer (2-3 phrases)
- Entre 2 et 5 lignes de devis réalistes avec des prix du marché français
- Les prix unitaires doivent être en euros HT, réalistes pour un artisan
- Retourne UNIQUEMENT du JSON valide, sans markdown ni texte autour

Format de réponse JSON strict:
{
  "title": "Titre du devis",
  "description": "Description détaillée du travail",
  "items": [
    { "description": "Libellé de la prestation", "quantity": 1, "unit_price": 150 }
  ]
}`;

      const userPrompt = `Génère un devis professionnel pour ce travail : "${description}"`;

      const response = await callClaude(systemPrompt, userPrompt, anthropicKey, 1024);
      const text = response;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Réponse IA invalide');
      const quote = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify({ success: true, quote }), {
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

    const systemPrompt = `Tu es l'assistant IA de ${businessName}, un professionnel artisan. Tu dois répondre aux messages des clients de manière polie, professionnelle et en français.

Directives:
- Sois courtois et professionnel
- Sois bref mais utile (2-3 phrases maximum)
- Parle au nom de l'artisan
- Propose de reprendre contact rapidement
- Ne fais pas de promesses que tu ne peux pas tenir
- Sois centré sur les besoins du client`;

    const userPrompt = `Le client "${message.clients.name}" a envoyé ce message:\n"${clientMessage}"\n\nGénère une réponse automatique courtoise et professionnelle.`;

    const autoReply = await callClaude(systemPrompt, userPrompt, anthropicKey, 256);

    const { error: replyError } = await supabase.from('messages').insert([{
      artisan_id:  message.artisan_id,
      client_id:   message.client_id,
      content:     autoReply,
      sender_type: 'ai',
    }]);

    if (replyError) throw replyError;

    return new Response(JSON.stringify({ success: true, reply: autoReply }), {
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
  const content = data.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic');
  return content.text;
}
