export interface GeneratedItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface GeneratedQuote {
  title: string;
  description: string;
  items: GeneratedItem[];
}

// ── Détection de surface / quantité dans le texte ─────────────────────────
function extractNumber(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m[²2]|m\b|mètres?|unités?|pièces?|heures?|h\b)/i);
  if (match) return parseFloat(match[1].replace(',', '.'));
  const plain = text.match(/\b(\d+(?:[.,]\d+)?)\b/);
  if (plain) return parseFloat(plain[1].replace(',', '.'));
  return null;
}

function has(text: string, ...words: string[]): boolean {
  return words.some(w => text.toLowerCase().includes(w));
}

// ── Catégories de travaux ─────────────────────────────────────────────────
type Category =
  | 'peinture' | 'carrelage' | 'plomberie' | 'electricite' | 'menuiserie'
  | 'maconnerie' | 'toiture' | 'isolation' | 'nettoyage' | 'jardinage'
  | 'climatisation' | 'parquet' | 'renovation' | 'generique';

function detectCategory(text: string): Category {
  const t = text.toLowerCase();
  if (has(t, 'peint', 'peinture', 'lasure', 'enduit', 'façade')) return 'peinture';
  if (has(t, 'carrel', 'faïence', 'dallage', 'pose de sol', 'mosaïque')) return 'carrelage';
  if (has(t, 'plomb', 'robinet', 'tuyau', 'fuite', 'sanitaire', 'chauffe', 'douche', 'baignoire', 'wc', 'salle de bain')) return 'plomberie';
  if (has(t, 'electr', 'tableau', 'prise', 'interrupteur', 'câblage', 'luminaire', 'éclairage')) return 'electricite';
  if (has(t, 'menuis', 'porte', 'fenêtre', 'volet', 'parquet', 'bois', 'placard', 'cuisine')) return 'menuiserie';
  if (has(t, 'maçon', 'béton', 'mur', 'cloison', 'demolit', 'fondation', 'agglo')) return 'maconnerie';
  if (has(t, 'toit', 'tuile', 'ardoise', 'zinguerie', 'charpente', 'gouttière')) return 'toiture';
  if (has(t, 'isol', 'laine', 'comble', 'isolation', 'thermique', 'phonique')) return 'isolation';
  if (has(t, 'nettoy', 'lavage', 'décapage', 'démoussage', 'hydro')) return 'nettoyage';
  if (has(t, 'jardin', 'taille', 'tonte', 'haie', 'pelouse', 'engazonn')) return 'jardinage';
  if (has(t, 'clim', 'climatisation', 'pompe à chaleur', 'pac', 'ventilation', 'vmc')) return 'climatisation';
  if (has(t, 'parquet', 'stratifié', 'sol souple', 'vinyle', 'moquette')) return 'parquet';
  if (has(t, 'rénov', 'réfection', 'réhabili', 'remise en état')) return 'renovation';
  return 'generique';
}

// ── Templates par catégorie ───────────────────────────────────────────────
function buildItems(category: Category, surface: number | null, text: string): GeneratedItem[] {
  const s = surface ?? 20;

  switch (category) {

    case 'peinture':
      return [
        { description: 'Protection du mobilier et des sols (bâches, scotch)', quantity: 1, unit_price: 80 },
        { description: 'Préparation des surfaces (ponçage, rebouchage, impression)', quantity: s, unit_price: 8 },
        { description: 'Application de peinture (2 couches)', quantity: s, unit_price: 12 },
        { description: 'Fourniture de peinture haut de gamme (mat ou satin)', quantity: Math.ceil(s / 10), unit_price: 45 },
        { description: 'Nettoyage et remise en état du chantier', quantity: 1, unit_price: 60 },
      ];

    case 'carrelage':
      return [
        { description: 'Dépose et évacuation de l\'ancien revêtement', quantity: s, unit_price: 15 },
        { description: 'Ragréage et préparation du support', quantity: s, unit_price: 10 },
        { description: 'Fourniture et pose de carrelage (joint compris)', quantity: s, unit_price: 45 },
        { description: 'Pose de plinthes assorties', quantity: Math.ceil(Math.sqrt(s) * 4), unit_price: 8 },
        { description: 'Nettoyage et joints de finition', quantity: 1, unit_price: 80 },
      ];

    case 'plomberie': {
      const isSalleDeBain = has(text, 'salle de bain', 'sanitaire', 'douche', 'baignoire', 'wc');
      if (isSalleDeBain) return [
        { description: 'Dépose et évacuation des anciens équipements', quantity: 1, unit_price: 250 },
        { description: 'Modification et adaptation du réseau d\'alimentation', quantity: 1, unit_price: 380 },
        { description: 'Pose de la robinetterie et des équipements sanitaires', quantity: 1, unit_price: 420 },
        { description: 'Raccordement des évacuations', quantity: 1, unit_price: 180 },
        { description: 'Test d\'étanchéité et mise en service', quantity: 1, unit_price: 90 },
      ];
      return [
        { description: 'Fourniture des pièces et matériaux plomberie', quantity: 1, unit_price: 150 },
        { description: 'Main d\'œuvre intervention plombier qualifié', quantity: 3, unit_price: 65 },
        { description: 'Tests et mise en service', quantity: 1, unit_price: 80 },
      ];
    }

    case 'electricite':
      return [
        { description: 'Fourniture du matériel électrique (câbles, boîtiers, prises)', quantity: 1, unit_price: 220 },
        { description: 'Pose et raccordement des circuits', quantity: 4, unit_price: 85 },
        { description: 'Mise en conformité du tableau électrique', quantity: 1, unit_price: 320 },
        { description: 'Tests et vérifications (norme NF C 15-100)', quantity: 1, unit_price: 120 },
      ];

    case 'menuiserie': {
      const isPorte = has(text, 'porte', 'fenêtre', 'volet', 'baie');
      if (isPorte) {
        const qty = extractNumber(text) ?? 1;
        return [
          { description: 'Dépose et évacuation de l\'ancienne menuiserie', quantity: qty, unit_price: 80 },
          { description: 'Fourniture et pose de menuiserie PVC/ALU (double vitrage)', quantity: qty, unit_price: 680 },
          { description: 'Pose des habillages intérieurs et joints d\'étanchéité', quantity: qty, unit_price: 95 },
          { description: 'Finitions et réglages', quantity: 1, unit_price: 80 },
        ];
      }
      return [
        { description: 'Fourniture des matériaux menuiserie', quantity: 1, unit_price: 350 },
        { description: 'Fabrication et pose sur mesure', quantity: surface ?? 5, unit_price: 120 },
        { description: 'Finition et traitement du bois', quantity: 1, unit_price: 140 },
      ];
    }

    case 'maconnerie':
      return [
        { description: 'Fourniture des matériaux (parpaings, ciment, sable)', quantity: 1, unit_price: 280 },
        { description: 'Travaux de maçonnerie — main d\'œuvre', quantity: surface ?? 10, unit_price: 55 },
        { description: 'Évacuation des gravats', quantity: 1, unit_price: 180 },
        { description: 'Finitions (enduit de ragréage)', quantity: surface ?? 10, unit_price: 18 },
      ];

    case 'toiture':
      return [
        { description: 'Inspection et diagnostic de la toiture', quantity: 1, unit_price: 150 },
        { description: 'Fourniture des tuiles / ardoises', quantity: s, unit_price: 35 },
        { description: 'Dépose des éléments défectueux', quantity: s, unit_price: 20 },
        { description: 'Repose et scellement des tuiles', quantity: s, unit_price: 25 },
        { description: 'Révision et étanchéité des faîtages', quantity: 1, unit_price: 280 },
      ];

    case 'isolation':
      return [
        { description: 'Fourniture des matériaux isolants (laine de verre/roche)', quantity: s, unit_price: 18 },
        { description: 'Pose de l\'isolation en soufflage ou en rouleau', quantity: s, unit_price: 12 },
        { description: 'Pare-vapeur et finitions', quantity: s, unit_price: 8 },
        { description: 'Évacuation des déchets', quantity: 1, unit_price: 90 },
      ];

    case 'nettoyage':
      return [
        { description: 'Nettoyage haute pression (façade, terrasse, toiture)', quantity: s, unit_price: 8 },
        { description: 'Traitement anti-mousse et anti-algues', quantity: s, unit_price: 5 },
        { description: 'Main d\'œuvre et déplacement', quantity: 4, unit_price: 55 },
      ];

    case 'jardinage': {
      const qty = extractNumber(text) ?? 200;
      return [
        { description: 'Tonte et ramassage de la pelouse', quantity: Math.ceil(qty / 100), unit_price: 45 },
        { description: 'Taille des haies et arbustes', quantity: 1, unit_price: 120 },
        { description: 'Désherbage et entretien des massifs', quantity: 1, unit_price: 90 },
        { description: 'Évacuation des végétaux', quantity: 1, unit_price: 60 },
      ];
    }

    case 'climatisation':
      return [
        { description: 'Fourniture du groupe extérieur + unité intérieure (Daikin/Mitsubishi)', quantity: 1, unit_price: 1200 },
        { description: 'Installation et raccordements frigorifiques', quantity: 1, unit_price: 450 },
        { description: 'Mise en service et paramétrage', quantity: 1, unit_price: 180 },
        { description: 'Liaison électrique dédiée', quantity: 1, unit_price: 220 },
      ];

    case 'parquet':
      return [
        { description: 'Dépose du revêtement existant', quantity: s, unit_price: 12 },
        { description: 'Ragréage du support', quantity: s, unit_price: 10 },
        { description: 'Fourniture et pose du parquet (flottant ou collé)', quantity: s, unit_price: 55 },
        { description: 'Pose des plinthes et quarts-de-rond', quantity: Math.ceil(Math.sqrt(s) * 4), unit_price: 7 },
        { description: 'Vitrification ou huilage (finition)', quantity: s, unit_price: 8 },
      ];

    case 'renovation':
      return [
        { description: 'Démolition et évacuation des gravats', quantity: s, unit_price: 20 },
        { description: 'Travaux de maçonnerie et plâtrerie', quantity: s, unit_price: 45 },
        { description: 'Revêtements de sol et murs', quantity: s, unit_price: 55 },
        { description: 'Peinture intérieure (2 couches)', quantity: s, unit_price: 18 },
        { description: 'Coordination et gestion de chantier', quantity: 1, unit_price: 350 },
      ];

    default:
      return [
        { description: 'Fourniture des matériaux nécessaires', quantity: 1, unit_price: 250 },
        { description: 'Main d\'œuvre qualifiée', quantity: 4, unit_price: 65 },
        { description: 'Déplacement et frais de chantier', quantity: 1, unit_price: 80 },
      ];
  }
}

// ── Titres par catégorie ──────────────────────────────────────────────────
const TITLES: Record<Category, string> = {
  peinture:      'Travaux de peinture intérieure / extérieure',
  carrelage:     'Pose et fourniture de carrelage',
  plomberie:     'Travaux de plomberie et sanitaires',
  electricite:   'Installation et mise aux normes électriques',
  menuiserie:    'Menuiserie et pose de fenêtres',
  maconnerie:    'Travaux de maçonnerie',
  toiture:       'Réfection et entretien de toiture',
  isolation:     'Travaux d\'isolation thermique',
  nettoyage:     'Nettoyage et traitement de surfaces',
  jardinage:     'Entretien d\'espaces verts',
  climatisation: 'Installation climatisation / pompe à chaleur',
  parquet:       'Fourniture et pose de parquet',
  renovation:    'Rénovation complète',
  generique:     'Devis de travaux',
};

// ── Point d'entrée ────────────────────────────────────────────────────────
export function generateQuoteLocally(prompt: string): GeneratedQuote {
  const category = detectCategory(prompt);
  const surface  = extractNumber(prompt);
  const items    = buildItems(category, surface, prompt);

  // Capitalise la 1re lettre du prompt pour la description
  const descPrompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  const description =
    `Devis établi suite à votre demande : ${descPrompt}. ` +
    `Les prix indiqués sont hors taxes et correspondent aux tarifs en vigueur. ` +
    `Un acompte de 30 % sera demandé à la signature.`;

  return {
    title: TITLES[category],
    description,
    items: items.map(it => ({
      ...it,
      unit_price: Math.round(it.unit_price),
    })),
  };
}
