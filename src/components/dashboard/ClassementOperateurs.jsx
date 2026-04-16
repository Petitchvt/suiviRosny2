import { useMemo } from "react";
import { Star } from "lucide-react";
import { EQUIPES, TEAM_COLORS, getEquipeOfOperateur } from "@/lib/teamsConfig";
import { normalizeOperateur } from "@/lib/normalizeOperateur";
import { grouperParOperateur } from "@/lib/pointsConfig";

const PTS_LABO = { NUTERGIA: 1, SOLGAR: 1.5, DUCRAY: 2 };

function calcPts(ventes) {
  return ventes.reduce((sum, v) => {
    const pts = PTS_LABO[v.laboratoire?.toUpperCase()?.trim()] || 0;
    return sum + pts * (v.quantite || 1);
  }, 0);
}

export default function ClassementOperateurs({ ventes, operateurs = [], bonusEquipes = [] }) {
  const rows = useMemo(() => {
    const allNoms = Object.values(EQUIPES).flatMap(e => e.membres);
    const ventesParOp = grouperParOperateur(ventes, normalizeOperateur);
    return allNoms
      .map((nom) => {
        const equipe = getEquipeOfOperateur(nom) || "?";
        const ventesOp = ventesParOp[nom] || [];
        const ptsVentes = calcPts(ventesOp);
        const boites = ventesOp.reduce((s, v) => s + (v.quantite || 1), 0);
        const isChef = Object.values(EQUIPES).some(e => e.chefs.includes(nom));
        // Bonus/malus issus des ajustements opérateur (BonusEquipe avec operateur_nom)
        const bonus = bonusEquipes
          .filter(b => b.operateur_nom === nom)
          .reduce((sum, b) => sum + (b.points || 0), 0);
        return { nom, equipe, points: ptsVentes + bonus, ptsVentes, bonus, boites, isChef };
      })
      .sort((a, b) => b.points - a.points);
  }, [ventes, operateurs, bonusEquipes]);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06]" style={{ background: "rgba(0,0,0,0.02)" }}>
        <h2 className="font-bold text-slate-800 text-lg">Classement Opérateurs</h2>
      </div>
      <div className="divide-y divide-black/[0.04]">
        {rows.map((row, idx) => {
          const config = EQUIPES[row.equipe];
          const colors = TEAM_COLORS[config?.color || "emerald"];
          return (
            <div key={row.nom} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors">
              <span className={`text-xs font-bold w-6 text-center ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-600" : "text-slate-300"}`}>
                {idx + 1}
              </span>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="font-medium text-slate-800 truncate">{row.nom}</span>
                {row.isChef && <Star className={`w-3 h-3 fill-current flex-shrink-0 ${colors.text}`} />}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${colors.badge}`}>{row.equipe}</span>
              <span className="text-xs text-slate-400 w-16 text-right flex-shrink-0">{row.boites} boîtes</span>
              <div className="flex items-center gap-1 w-28 justify-end flex-shrink-0">
                <span className={`text-sm font-bold ${colors.text}`}>{row.points.toFixed(1)} pts</span>
                {row.bonus !== 0 && (
                  <span className={`text-xs font-semibold ${row.bonus > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ({row.bonus > 0 ? "+" : ""}{row.bonus})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}