import { TEAM_COLORS, EQUIPES } from "@/lib/teamsConfig";
import { labelSemaine } from "@/lib/semaineUtils";
import { CheckCircle2, Circle, History } from "lucide-react";

const TYPE_BADGE = {
  strategie: "bg-amber-100 text-amber-700",
  bonus: "bg-emerald-100 text-emerald-700",
  malus: "bg-red-100 text-red-700",
};

const TYPE_EMOJI = { strategie: "🃏", bonus: "✅", malus: "❌" };

export default function HistoriqueTirages({ tirages, semaine, onToggleApplique }) {
  // Grouper par équipe
  const parEquipe = Object.keys(EQUIPES).reduce((acc, eq) => {
    const t = tirages.filter(t => t.equipe === eq);
    if (t.length > 0) acc[eq] = t;
    return acc;
  }, {});

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06] flex items-center gap-2" style={{ background: "rgba(0,0,0,0.02)" }}>
        <History className="w-4 h-4 text-slate-400" />
        <h2 className="font-bold text-slate-800">Tirages de la semaine</h2>
        <span className="text-xs text-slate-400 ml-1">{labelSemaine(semaine)}</span>
      </div>
      <div className="divide-y divide-black/[0.04]">
        {Object.entries(parEquipe).map(([equipe, tEquipe]) => {
          const config = EQUIPES[equipe];
          const colors = TEAM_COLORS[config?.color || "emerald"];
          return (
            <div key={equipe}>
              <div className={`px-5 py-2 text-xs font-bold uppercase tracking-wide ${colors.text}`} style={{ background: "rgba(0,0,0,0.015)" }}>
                {equipe}
              </div>
              {tEquipe.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02]">
                  <span className="text-lg">{TYPE_EMOJI[t.type_carte]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[t.type_carte]}`}>{t.type_carte}</span>
                      <span className="text-sm font-semibold text-slate-800">{t.carte_nom}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(t.created_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleApplique({ id: t.id, applique: !t.applique })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      t.applique
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {t.applique
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Appliqué</>
                      : <><Circle className="w-3.5 h-3.5" /> À appliquer</>
                    }
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}