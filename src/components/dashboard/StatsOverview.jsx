import { Package, Users, Trophy, Star } from "lucide-react";

export default function StatsOverview({ totalBoites, totalPoints, nbOperateurs, topOperateur }) {
  const stats = [
    { label: "Boîtes sorties", value: totalBoites, icon: Package, color: "text-emerald-600" },
    { label: "Points totaux", value: totalPoints.toFixed(1), icon: Star, color: "text-amber-500" },
    { label: "Opérateurs", value: nbOperateurs, icon: Users, color: "text-violet-600" },
    { label: "Top Opérateur", value: topOperateur || "—", icon: Trophy, color: "text-rose-500", isText: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-muted">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
          </div>
          <p className={`font-bold ${s.isText ? "text-lg truncate" : "text-3xl"} text-foreground`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}