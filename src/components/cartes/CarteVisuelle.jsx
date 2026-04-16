export default function CarteVisuelle({ carte, type }) {
  const typeConfig = {
    strategie: { bg: "from-amber-50 to-amber-100", border: "border-amber-300", label: "STRATÉGIE", labelColor: "text-blue-600" },
    bonus: { bg: "from-emerald-50 to-emerald-100", border: "border-emerald-300", label: "BONUS", labelColor: "text-emerald-600" },
    malus: { bg: "from-red-50 to-red-100", border: "border-red-300", label: "MALUS", labelColor: "text-red-600" },
  };

  const config = typeConfig[type];

  return (
    <div className={`relative w-48 h-72 rounded-3xl border-4 ${config.border} bg-gradient-to-br ${config.bg} shadow-2xl p-6 flex flex-col justify-between`} style={{ perspective: "1000px" }}>
      {/* Coin supérieur gauche - lettre */}
      <div className="absolute top-3 left-3 text-2xl font-black text-slate-300 opacity-50">
        {carte.nom.charAt(0).toUpperCase()}
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col items-center gap-3 flex-1 justify-center">
        <div className="text-5xl">{carte.emoji}</div>
        <h2 className="text-center font-black text-sm leading-tight text-slate-800">{carte.nom.toUpperCase()}</h2>
      </div>

      {/* Description */}
      <div className="text-center">
        <p className="text-xs leading-tight text-slate-700 font-semibold">{carte.description}</p>
      </div>

      {/* Coin inférieur droit - lettre */}
      <div className="absolute bottom-3 right-3 text-2xl font-black text-slate-300 opacity-50 rotate-180">
        {carte.nom.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}