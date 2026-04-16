import React from "react";
import { Package, TrendingUp, TrendingDown, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, iconColor }) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border border-border/60 shadow-sm px-5 py-4">
      <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function StatsBar({ references }) {
  const total = references.length;
  const trending_up = references.filter(r => r.ventes_s != null && r.ventes_s1 != null && r.ventes_s > r.ventes_s1).length;
  const trending_down = references.filter(r => r.ventes_s != null && r.ventes_s1 != null && r.ventes_s < r.ventes_s1).length;
  
  const lastUpdate = references.reduce((latest, r) => {
    if (r.updated_at && (!latest || r.updated_at > latest)) return r.updated_at;
    return latest;
  }, null);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Package} label="Références suivies" value={total} iconColor="text-primary" />
      <StatCard icon={TrendingUp} label="En hausse" value={trending_up} iconColor="text-emerald-600" />
      <StatCard icon={TrendingDown} label="En baisse" value={trending_down} iconColor="text-red-500" />
      <StatCard icon={Clock} label="Dernière MAJ" value={lastUpdate || "—"} iconColor="text-muted-foreground" />
    </div>
  );
}