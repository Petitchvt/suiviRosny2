import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ProductsTimeline({ products, statsMap }) {
  const CYCLE_DAYS = 14;

  const getProductPosition = (product) => {
    const dateStr = product.date_entree || product.created_date?.split('T')[0];
    if (!dateStr) return null;
    const days = differenceInDays(new Date(), parseISO(dateStr));
    return Math.max(0, Math.min(CYCLE_DAYS - 1, days));
  };

  const getVariantStyle = (status) => {
    switch (status) {
      case 'TOP':
        return { bg: 'bg-green-100', border: 'border-green-400', icon: TrendingUp, color: 'text-green-600' };
      case 'FLOP':
        return { bg: 'bg-red-100', border: 'border-red-400', icon: TrendingDown, color: 'text-red-600' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-400', icon: Minus, color: 'text-gray-600' };
    }
  };

  const ProductDot = ({ product }) => {
    const style = getVariantStyle(product.status);
    const Icon = style.icon;
    const stats = statsMap?.[product.ean] || {};
    const libelle = stats.libelle || product.libelle || product.ean;

    return (
      <div className="group relative">
        <div className={`w-8 h-8 rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}>
          <Icon className={`w-4 h-4 ${style.color}`} />
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
          {libelle}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cycle 14 jours</p>
      
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        {/* Légende */}
        <div className="flex gap-3 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-[10px] text-muted-foreground">TOP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-gray-400 flex items-center justify-center">
              <Minus className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-[10px] text-muted-foreground">MIDDLE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-[10px] text-muted-foreground">FLOP</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Ligne de base */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />

          {/* Jours */}
          <div className="flex justify-between gap-1 px-1">
            {Array.from({ length: CYCLE_DAYS }).map((_, day) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[9px] font-bold text-muted-foreground">J{day}</div>
                
                {/* Conteneur pour les produits */}
                <div className="relative w-full flex flex-col items-center gap-0.5 min-h-8">
                  {products
                    .filter(p => getProductPosition(p) === day)
                    .map((p, idx) => (
                      <div key={`${p.id}-${idx}`} style={{ marginTop: `${idx * 20}px` }}>
                        <ProductDot product={p} />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="flex gap-2 justify-center text-[10px] text-muted-foreground border-t border-border pt-2">
          <span>TOP: {products.filter(p => p.status === 'TOP').length}</span>
          <span>•</span>
          <span>MIDDLE: {products.filter(p => p.status === 'MIDDLE').length}</span>
          <span>•</span>
          <span>FLOP: {products.filter(p => p.status === 'FLOP').length}</span>
        </div>
      </div>
    </div>
  );
}