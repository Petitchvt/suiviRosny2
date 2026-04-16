import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function MissionRow({ m, colors }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-lg">{m.done ? "🃏" : "⬜"}</span>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <button
              className="text-sm text-slate-700 font-medium truncate max-w-[240px] hover:underline text-left"
              onClick={() => setOpen(o => !o)}
              title="Voir le détail des ventes comptabilisées"
            >
              {m.label}
              {open ? <ChevronUp className="inline w-3 h-3 ml-1 text-slate-400" /> : <ChevronDown className="inline w-3 h-3 ml-1 text-slate-400" />}
            </button>
            <span className={`text-sm font-semibold ml-2 flex-shrink-0 ${m.done ? colors.text : "text-slate-400"}`}>
              {m.total}/{m.objectif}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${m.done ? "bg-gradient-to-r " + colors.gradient : "bg-slate-300"}`}
              style={{ width: `${m.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Détail des ventes matchées */}
      {open && (
        <div className="ml-8 mt-2 mb-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs space-y-1">
          {m.ventesMatchees.length === 0 ? (
            <p className="text-slate-400 italic">Aucune vente comptabilisée</p>
          ) : (
            <>
              <p className="font-semibold text-slate-500 mb-1">Ventes comptabilisées :</p>
              {m.ventesMatchees.map((v, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <span>{v.operateur} <span className="text-slate-400">— {v.produit}</span></span>
                  <span className="font-semibold ml-2">×{v.quantite}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-700">
                <span>Total</span>
                <span>{m.total}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}