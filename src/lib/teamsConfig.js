export const EQUIPES = {
  "Équipe 1": {
    membres: ["Evelyne", "Charlotte", "Francoise", "Frederique", "Aurélie", "Céline K", "Céline N", "Aurore", "Ana Carina"],
    chefs: ["Frederique"],
    color: "emerald",
  },
  "Équipe 2": {
    membres: ["Rapher", "Laila", "Loubna", "Laurent", "Jonas", "Kerina", "Rachid", "Kamille", "Thérèse"],
    chefs: ["Rapher"],
    color: "amber",
  },
  "Équipe 3": {
    membres: ["Salah", "Shaïnese", "Samia", "Viviane", "Sendos", "Youssef", "Sally", "Véronique", "Sophie"],
    chefs: ["Youssef"],
    color: "violet",
  },
};

export const MISSIONS = [
  { id: "solgar_mag", label: "Solgar Magnésium Chelaté", laboratoire: "SOLGAR", produit: "Solgar Magnésium Chelaté", objectif: 15 },
  { id: "solgar_mel", label: "Solgar Super mélatonine", laboratoire: "SOLGAR", produit: "Solgar Super mélatonine", objectif: 15 },
  { id: "solgar_zinc", label: "Solgar Zinc Piccolinate", laboratoire: "SOLGAR", produit: "Solgar Zinc Piccolinate", objectif: 15 },
  { id: "ducray_kelual", label: "DUCRAY Kelual ds shamp 100ML 2020", laboratoire: "DUCRAY", produit: "DUCRAY Kelual ds shamp 100ML 2020", objectif: 12 },
  { id: "ducray_elution", label: "DUCRAY ELUTION SHP DOUX EQUILIBRANT 400ML", laboratoire: "DUCRAY", produit: "DUCRAY ELUTION SHP DOUX EQUILIBRANT 400ML", objectif: 10 },
  { id: "nutergia_atb", label: "NUTERGIA ergyphilus atb", laboratoire: "NUTERGIA", produit: "NUTERGIA ergyphilus atb", objectif: 15 },
  { id: "nutergia_confort", label: "NUTERGIA ergyphilus confort", laboratoire: "NUTERGIA", produit: "NUTERGIA ergyphilus confort", objectif: 15 },
  { id: "nutergia_plus", label: "NUTERGIA ergyphilus plus", laboratoire: "NUTERGIA", produit: "NUTERGIA ergyphilus plus", objectif: 15 },
];

export const TEAM_COLORS = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    ring: "ring-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    light: "bg-emerald-500/10",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
    ring: "ring-amber-200",
    badge: "bg-amber-100 text-amber-700",
    light: "bg-amber-500/10",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
    ring: "ring-violet-200",
    badge: "bg-violet-100 text-violet-700",
    light: "bg-violet-500/10",
  },
};

function deaccent(s) {
  return s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
}

export function getEquipeOfOperateur(nom) {
  for (const [equipe, config] of Object.entries(EQUIPES)) {
    if (config.membres.some(m => deaccent(m) === deaccent(nom))) {
      return equipe;
    }
  }
  return null;
}

/**
 * Références Ducray acceptées (variants de la même référence)
 */
function normalizeDucray(s) {
  if (!s || typeof s !== 'string') return "";
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
}

// Tous les produits Ducray reconnus en base
const DUCRAY_PRODUITS = [
  "ducray kelual ds shamp 100ml 2020",
  "ducray elution shp doux equilibrant 400ml",
  "ducray kelual emulsion keratoreductrice 50ml",
];

function isDucrayProduit(produit) {
  const norm = normalizeDucray(produit);
  return DUCRAY_PRODUITS.some(p => norm === normalizeDucray(p));
}

/**
 * Vérifie si un intitulé de produit reçu correspond à un produit mission.
 * On découpe les deux en mots et on vérifie que tous les mots significatifs
 * du produit reçu sont contenus dans le produit mission (ou inversement).
 * Ex: "solgar zinc pic" → correspond à "Solgar Zinc Piccolinate"
 */
function produitMatch(recu, mission) {
  const norm = (s) => s?.toLowerCase?.().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim() || "";
  // Mots significatifs : 3+ lettres, non purement numériques
  const sigWords = (s) => norm(s).split(/\s+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));

  const missionStr = typeof mission === 'object' ? mission.produit : mission;
  const wordsMission = sigWords(missionStr);
  const wordsRecu = sigWords(recu);

  if (wordsRecu.length === 0 || wordsMission.length === 0) return false;

  // Tous les mots-clés de la MISSION doivent être présents dans le produit reçu (correspondance exacte)
  return wordsMission.every(wm => wordsRecu.some(wr => wr === wm));
}

/**
 * Matching spécialisé pour Ducray qui accepte les variants
 */
export function produitMatchDucray(recu, mission) {
  // Pour les missions Ducray, matcher contre les produits réels en base
  if (mission.laboratoire === "DUCRAY") {
    if (mission.id === "ducray_kelual") {
      return normalizeDucray(recu) === normalizeDucray("DUCRAY KELUAL DS SHAMP 100ML 2020");
    }
    if (mission.id === "ducray_elution") {
      return normalizeDucray(recu) === normalizeDucray("DUCRAY ELUTION SHP DOUX EQUILIBRANT 400ML");
    }
  }
  // Matching spécial pour Solgar Zinc Piccolinate (accepte "picc", "pic", etc.)
  if (mission.id === "solgar_zinc") {
    const normRecu = normalizeDucray(recu);
    // Accepter toute variante contenant "solgar" + "zinc" + "pic" (début de "piccolinate")
    return normRecu.includes("solgar") && normRecu.includes("zinc") && normRecu.includes("pic");
  }
  return produitMatch(recu, mission);
}

export function calculerCartes(ventesByEquipe, missions) {
  let cartes = 0;
  for (const mission of missions) {
    let total = 0;
    for (const v of ventesByEquipe) {
      const labMatch = v.laboratoire?.toUpperCase()?.trim() === mission.laboratoire.toUpperCase();
      const match = labMatch && produitMatchDucray(v.produit, mission);
      if (match) {
        total += v.quantite || 1;
      }
    }
    if (total >= mission.objectif) cartes++;
  }
  return cartes;
}