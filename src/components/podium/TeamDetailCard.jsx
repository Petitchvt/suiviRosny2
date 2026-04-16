import { Star, CreditCard } from "lucide-react";
import { EQUIPES, TEAM_COLORS, MISSIONS } from "@/lib/teamsConfig";
import { POINTS_PAR_LABO } from "@/lib/pointsConfig";

function produitMatch(recu, mission) {
  const norm = (s) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim() || "";
  const sigWords = (s) => norm(s).split(/\s+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));
  const wordsMission = sigWords(mission);
  const wordsRecu = sigWords(recu);
  if (wordsRecu.length === 0 || wordsMission.length === 0) return false;
  return wordsMission.every(wm => wordsRecu.some(wr => wr === wm));
}

export default function TeamDetailCard({ equipe, ventesEquipe, points, cartes }) {
  const config = EQUIPES[equipe];
  const colors = TEAM_COLORS[config?.color || "emerald"];

  // Progress par mission
  const missionsProgress = MISSIONS.map((mission) => {
    let total = 0;
    for (const v of ventesEquipe) {
      const labMatch = v.laboratoire?.toUpperCase()?.trim() === mission.laboratoire.toUpperCase();
      if (labMatch && produitMatch(v.produit, mission.produit)) total += v.quantite || 1;
    }
    const pct = Math.min(100, Math.round((total / mission.objectif) * 100));
    return { ...mission, total, pct, done: total >= mission.objectif };
  });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className={`px-5 py-4 flex items-center justify-between border-b border-black/[0.06]`} style={{background: "rgba(0,0,0,0.02)"}}>
        <div>
          <h3 className={`font-bold text-lg ${colors.text}`}>{equipe}</h3>
          <p className="text-sm text-slate-400">{config?.membres.length} membres</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-extrabold ${colors.text}`}>{points.toFixed(1)} pts</p>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">{cartes} carte{cartes > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Membres */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[...config.membres].sort((a, b) => {
            const aChef = config.chefs.includes(a) ? -1 : 1;
            const bChef = config.chefs.includes(b) ? -1 : 1;
            return aChef - bChef;
          }).map((m) => (
            <span key={m} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
              {config.chefs.includes(m) && <Star className="w-3 h-3 fill-current" />}
              <span>{m}</span>
            </span>
          ))}
        </div>

        {/* Missions */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cartes débloquées</p>
        <div className="space-y-2">
          {missionsProgress.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-500 truncate max-w-[180px]">{m.label}</span>
                  <span className={`text-xs font-medium ${m.done ? colors.text : "text-muted-foreground"}`}>
                    {m.total}/{m.objectif}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${m.done ? "bg-gradient-to-r " + colors.gradient : "bg-muted-foreground/30"}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
              <span className="text-base">{m.done ? "🃏" : "⬜"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}