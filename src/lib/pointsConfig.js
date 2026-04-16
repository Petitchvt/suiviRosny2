export const POINTS_PAR_LABO = {
  "NUTERGIA": 1,
  "SOLGAR": 1.5,
  "DUCRAY": 2,
};

export const LABO_COLORS = {
  "NUTERGIA": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "SOLGAR": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "DUCRAY": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
};

export function calculerPoints(ventes) {
  let total = 0;
  for (const v of ventes) {
    const qty = parseInt(v.quantite) || 1;
    const labo = v.laboratoire?.toUpperCase()?.trim();
    const pts = POINTS_PAR_LABO[labo] || 0;
    total += pts * qty;
  }
  return total;
}

export function grouperParOperateur(ventes, normalize = (x) => x) {
  const map = {};
  for (const v of ventes) {
    const op = normalize(v.operateur?.trim());
    if (!op) continue;
    if (!map[op]) map[op] = [];
    map[op].push(v);
  }
  return map;
}

export function grouperParLabo(ventes) {
  const map = {};
  for (const v of ventes) {
    const labo = v.laboratoire?.toUpperCase()?.trim();
    if (!labo) continue;
    if (!map[labo]) map[labo] = { count: 0, produits: {} };
    const qty = parseInt(v.quantite) || 1;
    map[labo].count += qty;
    const produit = v.produit?.trim() || "Inconnu";
    if (!map[labo].produits[produit]) map[labo].produits[produit] = 0;
    map[labo].produits[produit] += qty;
  }
  return map;
}