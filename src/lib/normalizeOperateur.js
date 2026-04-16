/**
 * Le script envoie "NOM Prénom" ou "NOM COMPOSE Prénom".
 * Les mots en MAJUSCULES = nom de famille, le dernier mot = prénom.
 *
 * Exemples :
 *   "DUPONT Evelyne"         → "Evelyne"
 *   "LOURENCO DIAS Thérèse"  → "Thérèse"
 *   "KADER Céline"           → "Céline K"  (doublon de prénom)
 *   "Ana Carina"             → "Ana Carina" (prénom composé dans la config)
 */

import { EQUIPES } from "./teamsConfig";

function deaccent(s) {
  return s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
}

function isUpperWord(w) {
  return w === w.toUpperCase() && w !== w.toLowerCase();
}

// Map prenom_deaccentué → [fullConfigName, ...]
function buildPrenomMap() {
  const allMembers = Object.values(EQUIPES).flatMap(e => e.membres);
  const map = {};
  for (const m of allMembers) {
    // Le premier mot du nom de config est considéré comme le prénom principal
    const firstWord = deaccent(m.trim().split(" ")[0]);
    if (!map[firstWord]) map[firstWord] = [];
    map[firstWord].push(m);
  }
  return map;
}

// Map nom_config_deaccentué_complet → nom_config_original (pour matching exact)
function buildFullNameMap() {
  const allMembers = Object.values(EQUIPES).flatMap(e => e.membres);
  const map = {};
  for (const m of allMembers) {
    map[deaccent(m)] = m;
  }
  return map;
}

const PRENOM_MAP = buildPrenomMap();
const FULL_NAME_MAP = buildFullNameMap();

const PRENOM_AVEC_DOUBLONS = Object.entries(PRENOM_MAP)
  .filter(([, members]) => members.length > 1)
  .map(([k]) => k);

export function normalizeOperateur(rawNom) {
  if (!rawNom) return rawNom;
  const parts = rawNom.trim().split(/\s+/);
  if (parts.length === 1) return rawNom.trim();

  // 1. Essai de correspondance exacte (déaccentuée) avec la config
  const exactMatch = FULL_NAME_MAP[deaccent(rawNom.trim())];
  if (exactMatch) return exactMatch;

  // 2. Détecter le découpage NOM(s) + Prénom
  //    Les mots tous-majuscules = nom de famille, les autres = prénom
  let nomParts = [];
  let prenomParts = [];
  let foundPrenom = false;

  for (const part of parts) {
    if (!foundPrenom && isUpperWord(part)) {
      nomParts.push(part);
    } else {
      foundPrenom = true;
      prenomParts.push(part);
    }
  }

  // Si tous les mots sont en majuscules (ex: "DUPONT EVELYNE"), le dernier = prénom
  if (prenomParts.length === 0 && nomParts.length >= 2) {
    prenomParts = [nomParts.pop()];
  }

  const prenom = prenomParts.join(" ");
  const nom = nomParts.join(" ");
  const prenomDeacc = deaccent(prenom);
  const nomInitiale = nom.charAt(0).toUpperCase();

  // 3. Essai de correspondance prénom seul (déaccentué) dans la config
  if (PRENOM_AVEC_DOUBLONS.includes(prenomDeacc)) {
    const candidates = PRENOM_MAP[prenomDeacc] || [];
    // Chercher le membre dont le 2e mot commence par la même initiale que le nom
    const match = candidates.find(c => {
      const cParts = c.trim().split(" ");
      return cParts.length > 1 && cParts[1].toUpperCase().startsWith(nomInitiale);
    });
    return match || `${capitalize(prenom)} ${nomInitiale}`;
  }

  const candidates = PRENOM_MAP[prenomDeacc] || [];
  if (candidates.length > 0) return candidates[0];

  // 4. Fallback : retourner le prénom capitalisé
  return prenom ? capitalize(prenom) : rawNom.trim();
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}