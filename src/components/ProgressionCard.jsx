import React, { useState } from 'react';
import { Calendar, Pencil, Check } from "lucide-react";

// Calcule le nombre de jours ouvrés (lun-sam) écoulés dans le mois jusqu'à aujourd'hui
function joursOuvresEcoules(today) {
  let count = 0;
  const d = new Date(today.getFullYear(), today.getMonth(), 1);
  while (d <= today) {
    const day = d.getDay(); // 0=dim, 6=sam
    if (day !== 0) count++; // lun à sam
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Calcule le nombre de jours ouvrés (lun-sam) dans tout le mois
function joursOuvresMois(year, month) {
  let count = 0;
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export default function ProgressionCard({ selectedMois, progression, onProgressionChange }) {
  const now = new Date();
  const MOIS_ORDER = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const isMoisCourant = selectedMois === MOIS_ORDER[now.getMonth()] || selectedMois === "all";
  const moisRef = selectedMois === "all" ? MOIS_ORDER[now.getMonth()] : selectedMois;
  const moisIdx = MOIS_ORDER.indexOf(moisRef);

  const totalJoursOuvres = joursOuvresMois(now.getFullYear(), moisIdx);
  const joursEcoules = isMoisCourant ? joursOuvresEcoules(now) : totalJoursOuvres;

  const progressionAuto = totalJoursOuvres > 0 ? (joursEcoules / totalJoursOuvres * 100) : 0;

  const [editing, setEditing] = useState(false);
  const [inputTotal, setInputTotal] = useState(String(progression.totalJours || totalJoursOuvres));

  const totalJoursCustom = progression.totalJours || totalJoursOuvres;
  const progressionValue = totalJoursCustom > 0 ? (joursEcoules / totalJoursCustom * 100) : 0;

  const handleSave = () => {
    const val = parseInt(inputTotal);
    if (!isNaN(val) && val > 0) {
      onProgressionChange({ ...progression, totalJours: val });
    }
    setEditing(false);
  };

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: "0 4px 24px 0 rgba(120,100,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
      }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.5), rgba(245,158,11,0.3))", border: "1px solid rgba(255,255,255,0.7)" }}>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progression du mois</span>
        </div>
        <span className="text-xl font-bold text-slate-800">{progressionValue.toFixed(1)}%</span>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-2.5 rounded-full bg-white/50 overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.7)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progressionValue, 100)}%`,
            background: "linear-gradient(90deg, #f59e0b, #f97316)"
          }} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
        <span>{joursEcoules} j. ouvrés écoulés</span>
        <div className="flex items-center gap-1.5">
          <span>sur</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={inputTotal}
                onChange={e => setInputTotal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="w-14 text-center rounded-lg border border-amber-300 bg-white/80 text-slate-700 font-semibold py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
              <button onClick={handleSave} className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setInputTotal(String(totalJoursCustom)); setEditing(true); }}
              className="flex items-center gap-1 font-semibold text-slate-600 hover:text-amber-600 transition-colors group">
              {totalJoursCustom} j. ouvrés
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}