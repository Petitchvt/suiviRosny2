import { useState } from "react";
import { TOUTES_CARTES, tirerCarteAleatoire, getCarteById } from "@/lib/cartesConfig";
import { TEAM_COLORS, EQUIPES } from "@/lib/teamsConfig";
import { Shuffle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CarteVisuelle from "./CarteVisuelle";

const TYPE_CONFIG = {
  strategie: { label: "Stratégie", emoji: "🃏", bg: "from-amber-400 to-amber-500" },
  bonus: { label: "Bonus", emoji: "✅", bg: "from-emerald-400 to-emerald-500" },
  malus: { label: "Malus", emoji: "❌", bg: "from-red-400 to-red-500" },
};

export default function TirageModal({ equipe, type, cartesRestantes, onConfirm, onClose }) {
  const [carteTiree, setCarteTiree] = useState(null);
  const [animation, setAnimation] = useState(false);

  const config = EQUIPES[equipe];
  const colors = TEAM_COLORS[config?.color || "emerald"];
  const typeConf = TYPE_CONFIG[type];

  function tirer() {
    setAnimation(true);
    setCarteTiree(null);
    setTimeout(() => {
      setCarteTiree(tirerCarteAleatoire(type));
      setAnimation(false);
    }, 600);
  }

  function confirmer() {
    if (carteTiree) onConfirm(equipe, type, carteTiree);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl w-full max-w-md p-6 relative">
        {/* Header */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-3xl">{typeConf.emoji}</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Tirage {typeConf.label}</h2>
          <p className={`text-sm font-semibold mt-1 ${colors.text}`}>{equipe}</p>
          {cartesRestantes > 1 && (
            <p className="text-xs text-slate-400 mt-0.5">{cartesRestantes} cartes restantes à tirer</p>
          )}
        </div>

        {/* Carte tirée */}
        <div className="min-h-[320px] flex items-center justify-center mb-6">
          {animation && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Tirage en cours...</p>
            </div>
          )}
          {!animation && carteTiree && (
            <div className="flex flex-col items-center gap-4">
              <CarteVisuelle carte={carteTiree} type={type} />
            </div>
          )}
          {!animation && !carteTiree && (
            <div className="text-center text-slate-400">
              <p className="text-4xl mb-2">🎴</p>
              <p className="text-sm">Appuyez sur "Tirer" pour révéler une carte</p>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={tirer}>
            <Shuffle className="w-4 h-4 mr-2" />
            {carteTiree ? "Retirer" : "Tirer"}
          </Button>
          {carteTiree && (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmer}>
              <Check className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          )}
        </div>

        {/* Liste des cartes disponibles */}
        <details className="mt-4">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
            Voir toutes les cartes {typeConf.label} ({TOUTES_CARTES[type]?.length})
          </summary>
          <div className="mt-2 space-y-1">
            {TOUTES_CARTES[type]?.map(c => (
              <div key={c.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-slate-50">
                <span className="text-base flex-shrink-0">{c.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{c.nom}</p>
                  <p className="text-xs text-slate-400">{c.action}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}