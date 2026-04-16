import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { getAcheteurDuLabo, ACHETEURS } from '@/lib/acheteurs';
import { useLaboAssignations } from '@/hooks/useLaboAssignation';

const ACHETEUR_COLORS = {
  riad: "#f97316",
  cedric: "#22c55e",
  jadujan: "#475569",
  rapher: "#eab308",
};

const MOIS_ORDER = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const normalizeMois = (m) => m ? m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

function joursOuvresMois(year, month) {
  let count = 0;
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function joursOuvresEcoules(today) {
  let count = 0;
  const d = new Date(today.getFullYear(), today.getMonth(), 1);
  while (d <= today) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function moisJusquaInclus(moisNom) {
  const idx = MOIS_ORDER.findIndex(m => normalizeMois(m) === normalizeMois(moisNom));
  return idx >= 0 ? MOIS_ORDER.slice(0, idx + 1) : MOIS_ORDER;
}

const EvolutionPill = ({ value }) => {
  const isPos = value > 0;
  const isZero = value === 0;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: isZero ? "rgba(148,163,184,0.2)" : isPos ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)",
        color: isZero ? "#94a3b8" : isPos ? "#059669" : "#dc2626",
        border: `1px solid ${isZero ? "rgba(148,163,184,0.3)" : isPos ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`
      }}>
      {isZero ? <Minus className="w-3 h-3" /> : isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isZero ? "0%" : `${isPos ? "+" : ""}${value.toFixed(1)}%`}
    </span>
  );
};

const ProgressionBar = ({ value, target }) => {
  const isOk = value >= target;
  const color = isOk ? "#16a34a" : "#dc2626";
  const bgColor = isOk ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)";
  const fillColor = isOk ? "rgba(22,163,74,0.7)" : "rgba(220,38,38,0.7)";
  // Échelle 0–100% (progression du mois), marqueur à la bonne position
  const scale = 100;
  const fillPct = Math.min((value / scale) * 100, 100);
  const targetPos = Math.min(target, 100);

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="relative flex-1 h-4 rounded-full overflow-visible" style={{ background: bgColor, border: `1px solid ${isOk ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
        {/* Barre de remplissage */}
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${fillPct}%`, background: fillColor }} />
        {/* Marqueur cible */}
        <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-slate-500 opacity-70 rounded-full"
          style={{ left: `${targetPos}%` }} />
      </div>
      <span className="text-xs font-bold w-12 text-right" style={{ color }}>{value.toFixed(1)}%</span>
    </div>
  );
};

const fmt = (val) => val > 0 ? `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—';
const cell = "px-4 py-3 text-sm";

const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col) return <ChevronUp className="w-3 h-3 opacity-20 inline ml-1" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 opacity-70 inline ml-1" />
    : <ChevronDown className="w-3 h-3 opacity-70 inline ml-1" />;
};

const ACHETEUR_LABELS = {
  riad: { nom: 'Riad', couleur: '#f97316' },
  cedric: { nom: 'Cédric', couleur: '#22c55e' },
  jadujan: { nom: 'Jadujan', couleur: '#94a3b8' },
  rapher: { nom: 'Rapher', couleur: '#eab308' },
};

function AcheteurAssignSelect({ labo, onAssign }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-slate-300 hover:text-violet-500 transition-colors underline underline-offset-2">
        Assigner
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <select
        autoFocus
        className="text-xs rounded-lg border border-violet-200 bg-white px-2 py-1 text-slate-600 outline-none"
        defaultValue=""
        onChange={e => { if (e.target.value) { onAssign(e.target.value); setOpen(false); } }}
        onBlur={() => setOpen(false)}>
        <option value="" disabled>Acheteur...</option>
        {Object.entries(ACHETEUR_LABELS).map(([id, a]) => (
          <option key={id} value={id}>{a.nom}</option>
        ))}
      </select>
    </div>
  );
}

export default function LaboComparisonTable({ entries, selectedMois, currentYear, onEdit, onDelete, progression = {}, labosAcheteur = [], onLaboClick, prorataMode = true, onProrataChange }) {
  const [sortCol, setSortCol] = useState('labo');
  const [sortDir, setSortDir] = useState('asc');
  const { getAssignation, assign } = useLaboAssignations();

  const previousYear = currentYear - 1;
  const now = new Date();
  const currentMoisName = MOIS_ORDER[now.getMonth()];
  const currentDayOfMonth = now.getDate();
  const currentMoisIdx = now.getMonth();
  const isCumul = selectedMois === "all";
  const moisPourCumul = moisJusquaInclus(currentMoisName);

  const moisRef = isCumul ? currentMoisName : selectedMois;
  const moisIdx = MOIS_ORDER.indexOf(moisRef);
  const totalJoursOuvres = progression.totalJours || joursOuvresMois(now.getFullYear(), moisIdx >= 0 ? moisIdx : now.getMonth());
  const joursEcoules = joursOuvresEcoules(now);
  const progressionPct = totalJoursOuvres > 0 ? (joursEcoules / totalJoursOuvres * 100) : 0;

  const entriesCurrent = entries.filter(e => String(parseInt(e.annee)) === String(currentYear));

  // Labos depuis les données + labos de l'acheteur (pour afficher tous, même sans données)
  const labosFromData = isCumul
    ? [...new Set(entriesCurrent.filter(e => moisPourCumul.some(m => normalizeMois(m) === normalizeMois(e.mois))).map(e => e.laboratoire))]
    : [...new Set(entriesCurrent.filter(e => normalizeMois(e.mois) === normalizeMois(selectedMois)).map(e => e.laboratoire))];

  // Normalisation pour comparaison
  const normalize = (s) => s.trim().toUpperCase().replace(/\s*\d{4}\s*\/\/.*$/, '').replace(/\s*\*+$/, '').trim();

  // Merge : labos de l'acheteur + labos en base (pour ne pas en perdre)
  const labosSet = new Set(labosFromData.map(l => l));
  if (labosAcheteur.length > 0) {
    // Pour chaque labo de l'acheteur, on cherche son nom réel en base
    labosAcheteur.forEach(laboConf => {
      const normConf = normalize(laboConf);
      const found = labosFromData.find(l => {
        const normData = normalize(l);
        return normConf === normData || normData.startsWith(normConf) || normConf.startsWith(normData);
      });
      if (!found) {
        // Pas en base pour ce mois, on ajoute le nom normalisé (sans suffixes)
        labosSet.add(normalize(laboConf));
      }
    });
  }
  const labos = [...labosSet].sort();

  if (labos.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Aucun laboratoire avec des données pour {isCumul ? `${currentMoisName} ${currentYear} (cumulé)` : `${selectedMois} ${currentYear}`}.
      </div>
    );
  }

  const rows = labos.map(labo => {
    const filtered = isCumul
      ? entriesCurrent.filter(e => e.laboratoire === labo && moisPourCumul.some(m => normalizeMois(m) === normalizeMois(e.mois)))
      : entriesCurrent.filter(e => e.laboratoire === labo && normalizeMois(e.mois) === normalizeMois(selectedMois));

    const currentCA = filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
    const previousCARaw = filtered.reduce((s, e) => s + (e.ca_ht_n1 || 0), 0);

    // Pour le calcul évolution/progression : proratiser N-1 si prorataMode et mois courant
    const isCurrentMonth = !isCumul && normalizeMois(selectedMois) === normalizeMois(currentMoisName);
    let previousCAForCalc = previousCARaw;
    if (prorataMode && isCurrentMonth && previousCARaw > 0) {
      const daysInMonth = new Date(currentYear, currentMoisIdx + 1, 0).getDate();
      previousCAForCalc = (previousCARaw / daysInMonth) * currentDayOfMonth;
    }

    // Affichage : toujours le CA total N-1 (pas de prorata)
    const previousCA = previousCARaw;

    const evolution = previousCAForCalc > 0 ? ((currentCA - previousCAForCalc) / previousCAForCalc * 100) : currentCA > 0 ? 100 : 0;
    const progressionVal = previousCAForCalc > 0 ? (currentCA / previousCAForCalc * 100) : 0;

    const acheteur = getAcheteurDuLabo(labo);
    const assignation = !acheteur ? getAssignation(labo) : null;
    const effectiveAcheteurId = acheteur?.id || assignation?.acheteur_id;
    const laboColor = effectiveAcheteurId ? (ACHETEUR_COLORS[effectiveAcheteurId] || "#64748b") : "#64748b";

    return { labo, currentCA, previousCA, previousCAForCalc, evolution, progressionVal, editEntries: filtered, laboColor, acheteur, assignation };
  });

  // Tri
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedRows = [...rows].sort((a, b) => {
    let va, vb;
    if (sortCol === 'labo') { va = a.labo.toLowerCase(); vb = b.labo.toLowerCase(); }
    else if (sortCol === 'progression') { va = a.progressionVal; vb = b.progressionVal; }
    else if (sortCol === 'evolution') { va = a.evolution; vb = b.evolution; }
    else { va = a.labo.toLowerCase(); vb = b.labo.toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCurrent = rows.reduce((s, r) => s + r.currentCA, 0);
  const totalPrevious = rows.reduce((s, r) => s + r.previousCA, 0);
  const totalPreviousForCalc = rows.reduce((s, r) => s + r.previousCAForCalc, 0);
  const totalEvolution = totalPreviousForCalc > 0 ? ((totalCurrent - totalPreviousForCalc) / totalPreviousForCalc * 100) : 0;
  const totalProgressionVal = totalPreviousForCalc > 0 ? (totalCurrent / totalPreviousForCalc * 100) : 0;

  const labelCurrent = isCumul ? `Jan→${currentMoisName} ${currentYear}` : `${selectedMois} ${currentYear}`;
  const labelPrevious = isCumul ? `Jan→${currentMoisName} ${previousYear}` : `${selectedMois} ${previousYear}`;

  const thSortable = (col, label, align = "left") => (
    <th className={`${cell} text-${align} font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-800 transition-colors`}
      onClick={() => handleSort(col)}>
      {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}>
      <div className="px-5 py-4 border-b border-white/50 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">Comparaison par laboratoire</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{isCumul ? `Cumul Jan→${currentMoisName}` : selectedMois}</span>
          <div className="flex items-center rounded-lg overflow-hidden text-xs font-semibold"
            style={{ border: "1px solid rgba(124,58,237,0.2)", background: "rgba(255,255,255,0.6)" }}>
            <button onClick={() => onProrataChange && onProrataChange(true)}
              className="px-3 py-1.5 transition-all"
              style={{ background: prorataMode ? "linear-gradient(135deg,#7c3aed,#3b82f6)" : "transparent", color: prorataMode ? "#fff" : "#94a3b8" }}>
              Prorata
            </button>
            <button onClick={() => onProrataChange && onProrataChange(false)}
              className="px-3 py-1.5 transition-all"
              style={{ background: !prorataMode ? "linear-gradient(135deg,#7c3aed,#3b82f6)" : "transparent", color: !prorataMode ? "#fff" : "#94a3b8" }}>
              Mois complet
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.5)" }}>
              {thSortable('labo', 'Laboratoire', 'left')}
              <th className={`${cell} text-right font-semibold text-slate-700`}>{labelCurrent}</th>
              <th className={`${cell} text-right font-semibold text-slate-400`}>{labelPrevious}</th>
              {thSortable('progression', 'Progression', 'left')}
              {thSortable('evolution', 'Évolution', 'center')}
              <th className={`${cell}`}></th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.labo}
                className="transition-colors hover:bg-white/30"
                style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                <td className={`${cell} font-semibold`} style={{ color: row.laboColor }}>
                  <div className="flex items-center gap-2">
                    {onLaboClick ? (
                      <button onClick={() => onLaboClick(row.labo)}
                        className="hover:underline underline-offset-2 text-left transition-opacity hover:opacity-75">
                        {row.labo}
                      </button>
                    ) : row.labo}
                    {!row.acheteur && !row.assignation && (
                      <AcheteurAssignSelect labo={row.labo} onAssign={(id) => assign({ laboratoire: row.labo, acheteur_id: id })} />
                    )}
                    {!row.acheteur && row.assignation && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: `${ACHETEUR_LABELS[row.assignation.acheteur_id]?.couleur}22`, color: ACHETEUR_LABELS[row.assignation.acheteur_id]?.couleur }}>
                        {ACHETEUR_LABELS[row.assignation.acheteur_id]?.nom}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${cell} text-right font-mono text-slate-800`}>{fmt(row.currentCA)}</td>
                <td className={`${cell} text-right font-mono text-slate-400`}>{fmt(row.previousCA)}</td>
                <td className={`${cell}`}>
                  {row.previousCA > 0
                    ? <ProgressionBar value={row.progressionVal} target={progressionPct} />
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className={`${cell} text-center`}>
                  {(row.currentCA > 0 || row.previousCA > 0) && <EvolutionPill value={row.evolution} />}
                </td>
                <td className={`${cell} text-center`}>
                  <div className="flex gap-1 justify-center">
                    {row.editEntries.length === 1 && (
                      <>
                        <button onClick={() => onEdit(row.editEntries[0])} className="p-1.5 rounded-lg transition-all hover:bg-white/60 text-slate-400 hover:text-violet-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(row.editEntries[0])} className="p-1.5 rounded-lg transition-all hover:bg-white/60 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.5)" }}>
              <td className={`${cell} font-bold text-slate-700`}>TOTAL</td>
              <td className={`${cell} text-right font-mono font-bold text-slate-800`}>{fmt(totalCurrent)}</td>
              <td className={`${cell} text-right font-mono font-bold text-slate-400`}>{fmt(totalPrevious)}</td>
              <td className={`${cell}`}>
                {totalPrevious > 0 && <ProgressionBar value={totalProgressionVal} target={progressionPct} />}
              </td>
              <td className={`${cell} text-center`}><EvolutionPill value={totalEvolution} /></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}