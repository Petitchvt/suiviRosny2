import { POINTS_PAR_LABO, LABO_COLORS } from "@/lib/pointsConfig";

export default function PointsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {Object.entries(POINTS_PAR_LABO).map(([labo, pts]) => {
        const colors = LABO_COLORS[labo] || {};
        return (
          <div key={labo} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors.dot || "bg-gray-400"}`} />
            <span className="text-sm font-medium text-slate-600">{labo}</span>
            <span className="text-xs text-slate-400">= {pts} pt{pts > 1 ? "s" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}