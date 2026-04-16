import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MOIS_ORDER = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const normalizeMois = (m) => m ? m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
const MOIS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function LaboChart({ entries, selectedMois, currentYear }) {
  const previousYear = currentYear - 1;
  const now = new Date();
  const currentMoisName = MOIS_ORDER[now.getMonth()];
  const isCumul = selectedMois === "all";

  const entriesCurrent = entries.filter(e => String(parseInt(e.annee)) === String(currentYear));

  let chartData = [];

  if (isCumul) {
    const moisIdx = MOIS_ORDER.indexOf(currentMoisName);
    const moisList = MOIS_ORDER.slice(0, moisIdx + 1);
    chartData = moisList.map((mois, i) => {
      const filtered = entriesCurrent.filter(e => normalizeMois(e.mois) === normalizeMois(mois));
      const current = filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
      const previous = filtered.reduce((s, e) => s + (e.ca_ht_n1 || 0), 0);
      return { name: MOIS_SHORT[i], [currentYear]: current || null, [previousYear]: previous || null };
    }).filter(d => d[currentYear] || d[previousYear]);
  } else {
    const labos = [...new Set(entriesCurrent.filter(e => normalizeMois(e.mois) === normalizeMois(selectedMois)).map(e => e.laboratoire))].sort();
    chartData = labos.map(labo => {
      const filtered = entriesCurrent.filter(e => e.laboratoire === labo && normalizeMois(e.mois) === normalizeMois(selectedMois));
      const current = filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
      const previous = filtered.reduce((s, e) => s + (e.ca_ht_n1 || 0), 0);
      return { name: labo.length > 12 ? labo.slice(0, 12) + '…' : labo, fullName: labo, [currentYear]: current || null, [previousYear]: previous || null };
    }).filter(d => d[currentYear] || d[previousYear]);
  }

  if (chartData.length === 0) return (
    <div className="py-16 text-center text-slate-400 text-sm">Aucune donnée à afficher.</div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    const item = chartData.find(d => d.name === label);
    return (
      <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.9)" }}>
        <p className="font-semibold text-slate-700 mb-1">{item?.fullName || label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="font-mono" style={{ color: entry.color }}>
            {entry.name} : {(entry.value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}>
      <div className="px-5 py-4 border-b border-white/50">
        <h3 className="font-semibold text-slate-700">
          {isCumul ? `Évolution mensuelle — Jan→${currentMoisName}` : `CA HT par laboratoire — ${selectedMois}`}
        </h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barGap={4} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
            <Bar dataKey={currentYear} fill="url(#gradCurrent)" radius={[6, 6, 0, 0]} />
            <Bar dataKey={previousYear} fill="rgba(148,163,184,0.4)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}