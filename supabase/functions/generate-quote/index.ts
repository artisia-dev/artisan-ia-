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
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('Clé Anthropic manquante');

    const { description } = await req.json();
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erreur API Anthropic: ${err}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA invalide');

    const quote = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, quote }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
