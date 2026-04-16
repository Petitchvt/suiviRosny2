import { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculerPoints, grouperParLabo, POINTS_PAR_LABO, LABO_COLORS } from "@/lib/pointsConfig";

export default function OperatorCard({ name, ventes, rank }) {
  const [expanded, setExpanded] = useState(false);
  const points = calculerPoints(ventes);
  const totalBoites = ventes.reduce((sum, v) => sum + (parseInt(v.quantite) || 1), 0);
  const parLabo = grouperParLabo(ventes);

  const medalColors = {
    1: "from-yellow-400 to-amber-500",
    2: "from-gray-300 to-gray-400",
    3: "from-amber-600 to-amber-700",
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-4">
          {rank <= 3 ? (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${medalColors[rank]} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
              {rank}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
              {rank}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground text-lg">{name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> {totalBoites} boîtes
              </span>
              {Object.keys(parLabo).map((labo) => {
                const colors = LABO_COLORS[labo] || {};
                return (
                  <Badge key={labo} variant="secondary" className={`${colors.bg || ""} ${colors.text || ""} ${colors.border || ""} border text-xs`}>
                    {labo}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{points.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4 bg-muted/30">
          {Object.entries(parLabo).map(([labo, data]) => {
            const colors = LABO_COLORS[labo] || {};
            const ptsPerUnit = POINTS_PAR_LABO[labo] || 0;
            return (
              <div key={labo}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot || "bg-gray-400"}`} />
                  <span className="font-medium text-sm text-foreground">{labo}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{data.count} boîtes · {(data.count * ptsPerUnit).toFixed(1)} pts</span>
                </div>
                <div className="ml-5 space-y-1">
                  {Object.entries(data.produits).sort((a, b) => b[1] - a[1]).map(([produit, qty]) => (
                    <div key={produit} className="flex items-center justify-between text-sm py-1 px-3 rounded-lg hover:bg-muted/60 transition-colors">
                      <span className="text-muted-foreground">{produit}</span>
                      <span className="font-medium text-foreground">{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}