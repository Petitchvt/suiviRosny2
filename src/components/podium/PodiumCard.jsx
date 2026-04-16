import { Trophy, CreditCard, Star } from "lucide-react";
import { TEAM_COLORS, EQUIPES } from "@/lib/teamsConfig";

export default function PodiumCard({ equipe, points, cartes, rank, isCenter, bonusPts, showCartes = true }) {
  const config = EQUIPES[equipe];
  const colors = TEAM_COLORS[config?.color || "emerald"];

  const heights = { 1: "h-36", 2: "h-24", 3: "h-16" };
  const trophyColors = { 1: "text-yellow-400", 2: "text-gray-400", 3: "text-amber-600" };
  const rankLabels = { 1: "1er", 2: "2ème", 3: "3ème" };

  return (
    <div className={`flex flex-col items-center gap-2 ${isCenter ? "order-first sm:order-none -mt-4" : ""}`}>
      {/* Card info */}
      <div className={`glass rounded-2xl px-5 py-4 text-center min-w-[140px] ${isCenter ? "glass-strong ring-2 " + colors.ring : ""}`}>
        <Trophy className={`w-6 h-6 mx-auto mb-1 ${trophyColors[rank]}`} />
        <h3 className="font-bold text-slate-800 text-lg">{equipe}</h3>
        <p className={`text-2xl font-extrabold mt-1 ${colors.text}`}>{points.toFixed(1)}</p>
        <p className="text-xs text-slate-400">points</p>
        {bonusPts !== 0 && (
          <p className={`text-xs font-semibold mt-0.5 ${bonusPts > 0 ? "text-emerald-500" : "text-red-500"}`}>
            ({bonusPts > 0 ? "+" : ""}{bonusPts} pts ajust.)
          </p>
        )}
        {showCartes && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">{cartes} carte{cartes > 1 ? "s" : ""}</span>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1">{config?.membres.length} membres</p>
      </div>

      {/* Podium block */}
      <div className={`w-full min-w-[140px] ${heights[rank]} rounded-t-xl flex items-start justify-center pt-2 ${
        rank === 1 ? "bg-gradient-to-b from-yellow-400 to-amber-500" :
        rank === 2 ? "bg-gradient-to-b from-gray-300 to-gray-400" :
        "bg-gradient-to-b from-amber-600 to-amber-700"
      }`}>
        <span className="text-white font-black text-2xl opacity-80">{rankLabels[rank]}</span>
      </div>
    </div>
  );
}