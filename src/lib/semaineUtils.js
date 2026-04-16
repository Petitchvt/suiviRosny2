import { getISOWeek, getISOWeekYear } from "date-fns";

// Date de début du challenge : mercredi 18 mars 2026
// Les semaines du challenge commencent chaque mercredi (sauf S1 qui commence le 18/03)
// S1 : 18/03 – 22/03 (mer-dim)
// S2 : 23/03 – 29/03 (lun-dim)
// S3 : 30/03 – 05/04 ...
// Fin : 03/05/2026

const CHALLENGE_DEBUT = new Date(2026, 2, 18); // 18 mars 2026

/**
 * Génère la liste des semaines du challenge.
 * S1 : 18/03 → 22/03 (5 jours), puis semaines lundi→dimanche jusqu'au 03/05.
 */
function genererSemainesChallenge() {
  const semaines = [];

  // S1 : 18/03 (mer) → 22/03 (dim)
  semaines.push({ debut: new Date(2026, 2, 18), fin: new Date(2026, 2, 22) });

  // Semaines suivantes : lundi → dimanche
  let lundi = new Date(2026, 2, 23); // 23/03
  const finChallenge = new Date(2026, 4, 3); // 03/05

  while (lundi <= finChallenge) {
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    semaines.push({
      debut: new Date(lundi),
      fin: dimanche > finChallenge ? new Date(finChallenge) : new Date(dimanche),
    });
    lundi.setDate(lundi.getDate() + 7);
  }

  return semaines;
}

const SEMAINES_CHALLENGE = genererSemainesChallenge();

function fmt(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

/**
 * Convertit une date en clé de semaine challenge "S1", "S2", etc.
 */
function dateToSemaineKey(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  for (let i = 0; i < SEMAINES_CHALLENGE.length; i++) {
    const s = SEMAINES_CHALLENGE[i];
    if (date >= s.debut && date <= s.fin) return `S${i + 1}`;
  }
  return null;
}

/**
 * Retourne la clé de la semaine courante ("S1", "S2", etc.)
 */
export function getSemaineActuelle() {
  return dateToSemaineKey(new Date()) || `S${SEMAINES_CHALLENGE.length}`;
}

/**
 * Retourne le label lisible d'une clé de semaine
 */
export function labelSemaine(key) {
  if (key === "global") return "Toute la période";
  const idx = parseInt(key.replace("S", ""), 10) - 1;
  const s = SEMAINES_CHALLENGE[idx];
  if (!s) return key;
  return `${fmt(s.debut)} – ${fmt(s.fin)}`;
}

/**
 * Extrait la clé semaine challenge d'un enregistrement de vente.
 * Priorité : champ `semaine` (date du lundi de la semaine ISO réelle de la vente).
 * On prend le jeudi de cette semaine ISO (+3 jours) pour tomber dans la bonne
 * semaine challenge (évite le cas du lundi 16/03 qui précède le challenge).
 * Fallback : updated_at, puis created_date.
 */
export function getSemaineKey(v) {
  if (v.semaine) {
    const lundi = new Date(v.semaine);
    if (!isNaN(lundi)) {
      // Jeudi de la même semaine ISO = lundi + 3 jours
      const jeudi = new Date(lundi);
      jeudi.setDate(lundi.getDate() + 3);
      const key = dateToSemaineKey(jeudi);
      if (key) return key;
    }
  }
  const dateStr = v.updated_at || v.created_date;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d)) return dateToSemaineKey(d);
  }
  return null;
}

/**
 * Filtre les ventes par semaine ("global" ou "S1", "S2", etc.)
 */
export function filtrerVentesParSemaine(ventes, semaineKey) {
  if (semaineKey === "global") return ventes;
  return ventes.filter(v => getSemaineKey(v) === semaineKey);
}

/**
 * Retourne la liste triée (desc) des semaines du challenge qui ont des ventes
 */
export function getSemainesDisponibles(ventes) {
  const set = new Set();
  for (const v of ventes) {
    const k = getSemaineKey(v);
    if (k) set.add(k);
  }
  // Trier par numéro de semaine décroissant
  return [...set].sort((a, b) => {
    const na = parseInt(a.replace("S", ""), 10);
    const nb = parseInt(b.replace("S", ""), 10);
    return nb - na;
  });
}

/**
 * Retourne toutes les semaines du challenge (pour le picker complet)
 */
export function getToutesSemaines() {
  return SEMAINES_CHALLENGE.map((_, i) => `S${i + 1}`);
}