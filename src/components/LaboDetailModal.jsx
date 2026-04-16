import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getAcheteurDuLabo } from '@/lib/acheteurs';
import { useLaboAssignations } from '@/hooks/useLaboAssignation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MOIS_ORDER = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const normalizeMois = (m) => m ? m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
const MOIS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const fmt = (val) => val > 0 ? `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—';

const EvoPill = ({ value }) => {
  const isPos = value > 0, isZero = value === 0;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
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

const ACHETEUR_LABELS = {
  riad: { nom: 'Riad', couleur: '#f97316' },
  cedric: { nom: 'Cédric', couleur: '#22c55e' },
  jadujan: { nom: 'Jadujan', couleur: '#94a3b8' },
  rapher: { nom: 'Rapher', couleur: '#eab308' },
};

export default function LaboDetailModal({ labo, entries, currentYear, onClose, allLabos = [], onNavigate, prorataMode = true }) {
  if (!labo) return null;

  const [assignOpen, setAssignOpen] = useState(false);
  const { getAssignation, assign } = useLaboAssignations();
  const acheteurConfig = getAcheteurDuLabo(labo);
  const assignation = !acheteurConfig ? getAssignation(labo) : null;
  const effectiveAcheteurId = acheteurConfig?.id || assignation?.acheteur_id;
  const acheteurInfo = effectiveAcheteurId ? ACHETEUR_LABELS[effectiveAcheteurId] : null;

  const previousYear = currentYear - 1;
  const now = new Date();
  const currentMoisIdx = now.getMonth();
  const currentDayOfMonth = now.getDate();

  // Navigation précédent / suivant
  const labos = allLabos.length > 0 ? allLabos : [...new Set(entries.map(e => e.laboratoire))].sort();
  const currentIndex = labos.indexOf(labo);
  const prevLabo = currentIndex > 0 ? labos[currentIndex - 1] : null;
  const nextLabo = currentIndex < labos.length - 1 ? labos[currentIndex + 1] : null;

  // Données par mois jusqu'au mois courant
  const chartData = MOIS_ORDER.slice(0, currentMoisIdx + 1).map((mois, i) => {
    const filtered = entries.filter(e =>
      e.laboratoire === labo && String(parseInt(e.annee)) === String(currentYear) && normalizeMois(e.mois) === normalizeMois(mois)
    );
    const current = filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
    const previous = filtered.reduce((s, e) => s + (e.ca_ht_n1 || 0), 0);
    return { name: MOIS_SHORT[i], mois, [currentYear]: current || null, [previousYear]: previous || null };
  });

  // Tableau récap par mois
  // Pour le mois en cours : prorate N-1 sur les jours écoulés
  const tableRows = MOIS_ORDER.slice(0, currentMoisIdx + 1).map((mois, idx) => {
    const filtered = entries.filter(e =>
      e.laboratoire === labo && String(parseInt(e.annee)) === String(currentYear) && normalizeMois(e.mois) === normalizeMois(mois)
    );
    const current = filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
    const previousRaw = filtered.reduce((s, e) => s + (e.ca_ht_n1 || 0), 0);

    // Pour le mois courant, proratiser N-1 pour le calcul d'évolution (si prorataMode)
    let previousForCalc = previousRaw;
    if (prorataMode && idx === currentMoisIdx && previousRaw > 0) {
      const daysInMonth = new Date(currentYear, currentMoisIdx + 1, 0).getDate();
      previousForCalc = (previousRaw / daysInMonth) * currentDayOfMonth;
    }

    const evo = previousForCalc > 0 ? ((current - previousForCalc) / previousForCalc * 100) : current > 0 ? 100 : 0;
    // Affichage : toujours le CA total N-1 (pas de prorata)
    return { mois, current, previous: previousRaw, previousRaw, evo, isCurrent: idx === currentMoisIdx };
  });

  // Total cumulé
  const totalCurrent = tableRows.reduce((s, r) => s + r.current, 0);
  const totalPrevious = tableRows.reduce((s, r) => s + r.previous, 0);
  // Pour l'évolution totale, recalculer avec prorata sur le mois courant
  const totalPreviousForCalc = tableRows.reduce((s, r) => {
    if (r.isCurrent && prorataMode && r.previousRaw > 0) {
      const daysInMonth = new Date(currentYear, currentMoisIdx + 1, 0).getDate();
      return s + (r.previousRaw / daysInMonth) * currentDayOfMonth;
    }
    return s + r.previous;
  }, 0);
  const totalEvo = totalPreviousForCalc > 0 ? ((totalCurrent - totalPreviousForCalc) / totalPreviousForCalc * 100) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map(entry => (
          <p key={entry.name} className="font-mono" style={{ color: entry.color }}>
            {entry.name} : {(entry.value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)"
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 px-6 py-5 border-b border-white/50 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-2">
            {onNavigate && prevLabo ? (
              <button onClick={() => onNavigate(prevLabo)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                title={prevLabo}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : <div className="w-8" />}
            <div>
              <h2 className="text-xl font-bold text-slate-800">{labo}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-500">{currentYear} vs {previousYear}</p>
                {acheteurInfo ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${acheteurInfo.couleur}22`, color: acheteurInfo.couleur, border: `1px solid ${acheteurInfo.couleur}44` }}>
                    <User className="w-3 h-3" />
                    {acheteurInfo.nom}
                  </span>
                ) : assignOpen ? (
                  <select autoFocus
                    className="text-xs rounded-lg border border-violet-200 bg-white px-2 py-1 text-slate-600 outline-none"
                    defaultValue=""
                    onChange={e => { if (e.target.value) { assign({ laboratoire: labo, acheteur_id: e.target.value }); setAssignOpen(false); } }}
                    onBlur={() => setAssignOpen(false)}>
                    <option value="" disabled>Acheteur...</option>
                    {Object.entries(ACHETEUR_LABELS).map(([id, a]) => (
                      <option key={id} value={id}>{a.nom}</option>
                    ))}
                  </select>
                ) : (
                  <button onClick={() => setAssignOpen(true)}
                    className="text-xs text-slate-400 hover:text-violet-500 transition-colors underline underline-offset-2">
                    + Assigner un acheteur
                  </button>
                )}
              </div>
            </div>
            {onNavigate && nextLabo ? (
              <button onClick={() => onNavigate(nextLabo)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                title={nextLabo}>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : <div className="w-8" />}
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Totaux */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: `CA ${currentYear}`, value: fmt(totalCurrent), color: "#7c3aed" },
              { label: `CA ${previousYear}`, value: fmt(totalPrevious), color: "#94a3b8" },
              { label: "Évolution", value: `${totalEvo >= 0 ? '+' : ''}${totalEvo.toFixed(1)}%`, color: totalEvo >= 0 ? "#059669" : "#dc2626" }
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}>
            <div className="px-5 py-3 border-b border-white/50">
              <p className="font-semibold text-slate-700 text-sm">Évolution mensuelle</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey={currentYear} fill="url(#gradModal)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={previousYear} fill="rgba(148,163,184,0.4)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="gradModal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau mois par mois */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}>
            <div className="px-5 py-3 border-b border-white/50">
              <p className="font-semibold text-slate-700 text-sm">Détail mensuel</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.6)" }}>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Mois</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-700">{currentYear}</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-400">{previousYear}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-600">Évol.</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(row => (
                    <tr key={row.mois} className="hover:bg-white/40 transition-colors"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.5)" }}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {row.mois}
                        {row.isCurrent && <span className="ml-1 text-xs text-slate-400">(j{currentDayOfMonth})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">{fmt(row.current)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400">{fmt(row.previous)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {(row.current > 0 || row.previous > 0) && <EvoPill value={row.evo} />}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.6)" }}>
                    <td className="px-4 py-2.5 font-bold text-slate-700">TOTAL</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{fmt(totalCurrent)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-400">{fmt(totalPrevious)}</td>
                    <td className="px-4 py-2.5 text-center"><EvoPill value={totalEvo} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}