export const CARTES_STRATEGIE = [
  {
    id: "marie_a_dit",
    nom: "Marie m'a dit",
    emoji: "🚚",
    description: "Permet de connaître les cartes jouées par les autres équipes sur une semaine ET de piocher une carte Malus OU Bonus",
    action: "Révèle les cartes jouées + pioche 1 carte Malus ou Bonus",
    couleur: "from-amber-100 to-amber-200",
    border: "border-amber-300",
    text: "text-amber-800",
  },
  {
    id: "cedrix",
    nom: "T'as 2mn Cédric ?",
    emoji: "🔧",
    description: "Permet de choisir une carte Bonus OU Malus",
    action: "Choisissez 1 carte Bonus ou 1 carte Malus",
    couleur: "from-blue-100 to-blue-200",
    border: "border-blue-300",
    text: "text-blue-800",
  },
  {
    id: "benrahmani",
    nom: "Il est là M.Benrahmani ?",
    emoji: "🚒",
    description: "Permet de choisir une carte Bonus ET une carte Malus",
    action: "Choisissez 1 carte Bonus ET 1 carte Malus",
    couleur: "from-yellow-100 to-yellow-200",
    border: "border-yellow-400",
    text: "text-yellow-800",
  },
];

export const CARTES_BONUS = [
  {
    id: "titulaire",
    nom: "J'appelle le titulaire",
    emoji: "📞",
    description: "Annule un malus reçu",
    action: "Annule un malus reçu par votre équipe",
    couleur: "from-green-100 to-emerald-200",
    border: "border-emerald-300",
    text: "text-emerald-800",
  },
  {
    id: "oups_mon_code",
    nom: "Oups mon code",
    emoji: "💥",
    description: "Les ventes de l'équipe ciblée passent dans votre camp aujourd'hui",
    action: "Les ventes d'une équipe ciblée vous sont transférées pour la journée",
    couleur: "from-green-100 to-emerald-200",
    border: "border-emerald-300",
    text: "text-emerald-800",
  },
  {
    id: "turbo_conseil",
    nom: "Turbo Conseil",
    emoji: "x2",
    description: "Points doublés sur la journée",
    action: "Vos points sont ×2 pour la journée",
    couleur: "from-green-100 to-emerald-200",
    border: "border-emerald-300",
    text: "text-emerald-800",
  },
  {
    id: "ultra_boost",
    nom: "Ultra Boost",
    emoji: "+15",
    description: "+15 points accordés à votre équipe",
    action: "+15 points ajoutés à votre équipe",
    couleur: "from-green-100 to-emerald-200",
    border: "border-emerald-300",
    text: "text-emerald-800",
  },
  {
    id: "expert_produit",
    nom: "Expert Produit",
    emoji: "⭐",
    description: "1 produit dans la journée = points ×3 (au choix)",
    action: "Choisissez 1 produit : ses points sont ×3 pour la journée",
    couleur: "from-green-100 to-emerald-200",
    border: "border-emerald-300",
    text: "text-emerald-800",
  },
];

export const CARTES_MALUS = [
  {
    id: "panne_conseil",
    nom: "Panne de Conseil !",
    emoji: "🔴",
    description: "L'équipe ciblée ne marque que la moitié des points aujourd'hui",
    action: "L'équipe ciblée ne marque que 50% de ses points pour la journée",
    couleur: "from-red-100 to-red-200",
    border: "border-red-300",
    text: "text-red-800",
  },
  {
    id: "trahison",
    nom: "Trahison",
    emoji: "🗡️",
    description: "Les points d'une personne passent dans votre camp pour la journée",
    action: "Les points d'un opérateur ciblé vous sont transférés pour la journée",
    couleur: "from-red-100 to-red-200",
    border: "border-red-300",
    text: "text-red-800",
  },
  {
    id: "robot",
    nom: "Robot",
    emoji: "🤖",
    description: "Les ventes de l'opérateur choisi ne comptent pas aujourd'hui",
    action: "Les ventes d'un opérateur ciblé sont annulées pour la journée",
    couleur: "from-red-100 to-red-200",
    border: "border-red-300",
    text: "text-red-800",
  },
  {
    id: "penurie_stock",
    nom: "Pénurie de Stock",
    emoji: "📦",
    description: "Les points d'une référence ciblée ne comptent pas aujourd'hui",
    action: "Les points d'un produit ciblé sont annulés pour la journée",
    couleur: "from-red-100 to-red-200",
    border: "border-red-300",
    text: "text-red-800",
  },
  {
    id: "retour_produit",
    nom: "Retour Produit",
    emoji: "↩️",
    description: "-10 points pour une équipe ciblée",
    action: "-10 points pour une équipe ciblée",
    couleur: "from-red-100 to-red-200",
    border: "border-red-300",
    text: "text-red-800",
  },
];

export const TOUTES_CARTES = {
  strategie: CARTES_STRATEGIE,
  bonus: CARTES_BONUS,
  malus: CARTES_MALUS,
};

export function getCarteById(id) {
  for (const cartes of Object.values(TOUTES_CARTES)) {
    const found = cartes.find(c => c.id === id);
    if (found) return found;
  }
  return null;
}

export function tirerCarteAleatoire(type) {
  const pool = TOUTES_CARTES[type];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}