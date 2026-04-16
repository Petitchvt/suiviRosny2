import React from 'react';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO, startOfWeek } from 'date-fns';

export default function ProductList({ products, ventesMap, statsMap }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  return (
    <div className="space-y-2">
      {products.map(p => {
        const daysInTG = differenceInDays(today, parseISO(p.date_entree));
        const isNewThisWeek = parseISO(p.date_entree) >= weekStart;
        const isOld = daysInTG >= 30;
        const vente = ventesMap[p.ean] || { quantite: 0, ca_ht: 0 };
        const stats = statsMap?.[p.ean] || {};
        const libelle = stats.libelle || p.libelle || p.ean;

        return (
          <div
            key={p.id}
            className={`bg-card border rounded-xl p-3 transition-all ${
              isNewThisWeek ? 'border-green-300 bg-green-50' :
              isOld ? 'border-orange-300 bg-orange-50' :
              'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{libelle}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.ean}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {isNewThisWeek && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0">NOUVEAU</Badge>
                )}
                {isOld && (
                  <Badge className="bg-orange-100 text-orange-600 border-orange-300 text-[10px] px-1.5 py-0">30J+</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs text-muted-foreground">
              <span>Entrée : {p.date_entree} ({daysInTG}j)</span>
              {stats.stock_actuel !== undefined && <span>Stock : <strong className="text-foreground">{stats.stock_actuel}</strong></span>}
              {stats.ventes_jour !== undefined && <span>Ventes/j : <strong className="text-foreground">{stats.ventes_jour}</strong></span>}
              {stats.ventes_total !== undefined && <span>Total : <strong className="text-foreground">{stats.ventes_total}</strong></span>}
              {vente.quantite > 0 && <span>7j : <strong className="text-foreground">{vente.quantite} ventes</strong></span>}
              {vente.ca_ht > 0 && <span>CA 7j : <strong className="text-foreground">{Number(vente.ca_ht).toFixed(2)}€</strong></span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}