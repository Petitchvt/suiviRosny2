import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import ProgressionCard from './ProgressionCard';

const MOIS_ORDER = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const normalizeMois = (m) => m ? m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

function StatCard({ stat }) {
  return (
    <div className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: "0 4px 24px 0 rgba(120,100,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
      }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl" style={{ background: stat.gradient, border: "1px solid rgba(255,255,255,0.7)" }}>
          <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{stat.label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800 truncate">{stat.value}</p>
    </div>
  );
}

export default function LaboStatsCards({ entries, currentYear, selectedMois, progression, onProgressionChange }) {
  const previousYear = currentYear - 1;
  const now = new Date();
  const currentMoisName = MOIS_ORDER[now.getMonth()];
  const isCumul = selectedMois === "all";
  const moisIdx = MOIS_ORDER.indexOf(isCumul ? currentMoisName : selectedMois);
  const moisList = moisIdx >= 0 ? MOIS_ORDER.slice(0, moisIdx + 1) : MOIS_ORDER;
  const moisFiltered = isCumul ? moisList : [selectedMois];

  const entriesCurrent = entries.filter(e =>
    String(parseInt(e.annee)) === String(currentYear) &&
    moisFiltered.some(m => normalizeMois(m) === normalizeMois(e.mois))
  );

  const totalCurrent = entriesCurrent.reduce((sum, e) => sum + (e.ca_ht_n || 0), 0);
  const totalPrevious = entriesCurrent.reduce((sum, e) => sum + (e.ca_ht_n1 || 0), 0);
  const evolution = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious * 100) : 0;
  const uniqueLabos = [...new Set(entries.map(e => e.laboratoire))].length;

  const label = isCumul ? `Jan→${currentMoisName}` : selectedMois;

  const stats = [
    {
      label: `CA ${currentYear} (${label})`,
      value: `${totalCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      icon: BarChart3,
      gradient: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))",
      iconColor: "#6366f1"
    },
    {
      label: `CA ${previousYear} (${label})`,
      value: `${totalPrevious.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      icon: BarChart3,
      gradient: "linear-gradient(135deg, rgba(148,163,184,0.4), rgba(203,213,225,0.3))",
      iconColor: "#94a3b8"
    },
    {
      label: "Évolution",
      value: `${evolution >= 0 ? '+' : ''}${evolution.toFixed(1)}%`,
      icon: evolution > 0 ? TrendingUp : evolution < 0 ? TrendingDown : Minus,
      gradient: evolution > 0
        ? "linear-gradient(135deg, rgba(52,211,153,0.45), rgba(16,185,129,0.3))"
        : evolution < 0
        ? "linear-gradient(135deg, rgba(248,113,113,0.45), rgba(239,68,68,0.3))"
        : "linear-gradient(135deg, rgba(148,163,184,0.4), rgba(203,213,225,0.3))",
      iconColor: evolution > 0 ? "#10b981" : evolution < 0 ? "#ef4444" : "#94a3b8"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard stat={stats[0]} />
      <StatCard stat={stats[1]} />
      <ProgressionCard selectedMois={selectedMois} progression={progression} onProgressionChange={onProgressionChange} />
      <StatCard stat={stats[2]} />
    </div>
  );
}