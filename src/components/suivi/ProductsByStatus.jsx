import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ProductsByStatus({ products, statsMap, ventesMap, sortBy = 'days' }) {
  const [sortMetric, setSortMetric] = useState(sortBy); // 'days' ou 'metric'

  const topProducts = products.filter(p => p.status === 'TOP');
  const middleProducts = products.filter(p => p.status === 'MIDDLE');
  const flopProducts = products.filter(p => p.status === 'FLOP');

  const sortProducts = (arr) => {
    if (sortMetric === 'days') {
      return [...arr].sort((a, b) => {
        const daysA = differenceInDays(new Date(), parseISO(a.date_entree || a.created_date?.split('T')[0]));
        const daysB = differenceInDays(new Date(), parseISO(b.date_entree || b.created_date?.split('T')[0]));
        return daysB - daysA;
      });
    }
    return arr;
  };

  const ProductCard = ({ product, variant }) => {
    const stats = statsMap?.[product.ean] || {};
    const libelle = stats.libelle || product.libelle || product.ean;
    const days = differenceInDays(new Date(), parseISO(product.date_entree || product.created_date?.split('T')[0]));

    const bgClass = variant === 'TOP' 
      ? 'bg-green-50 border-green-200'
      : variant === 'FLOP'
      ? 'bg-red-50 border-red-200'
      : 'bg-gray-50 border-gray-200';

    const iconClass = variant === 'TOP'
      ? 'text-green-600'
      : variant === 'FLOP'
      ? 'text-red-500'
      : 'text-gray-500';

    const Icon = variant === 'TOP' 
      ? TrendingUp 
      : variant === 'FLOP'
      ? TrendingDown
      : Minus;

    const evolution = product.evolution_percent?.toFixed(1) || '—';

    return (
      <div className={`border rounded-lg p-3 ${bgClass}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{libelle}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.ean}</p>
          </div>
          <Icon className={`w-5 h-5 ${iconClass} shrink-0`} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
          <span>Jours : <strong className="text-foreground">{days}</strong></span>
          <span>Évolution : <strong className="text-foreground">{evolution}%</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-end mb-4">
        <span className="text-xs text-muted-foreground">Trier par :</span>
        <button
          onClick={() => setSortMetric('days')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            sortMetric === 'days'
              ? 'bg-primary text-white'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Jours
        </button>
        <button
          onClick={() => setSortMetric('metric')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            sortMetric === 'metric'
              ? 'bg-primary text-white'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Évolution
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-600">TOP ({topProducts.length})</span>
          </div>
          <div className="space-y-2">
            {sortProducts(topProducts).map(p => (
              <ProductCard key={p.id} product={p} variant="TOP" />
            ))}
            {topProducts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
            )}
          </div>
        </div>

        {/* MIDDLE */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <Minus className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-600">MIDDLE ({middleProducts.length})</span>
          </div>
          <div className="space-y-2">
            {sortProducts(middleProducts).map(p => (
              <ProductCard key={p.id} product={p} variant="MIDDLE" />
            ))}
            {middleProducts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
            )}
          </div>
        </div>

        {/* FLOP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-600">FLOP ({flopProducts.length})</span>
          </div>
          <div className="space-y-2">
            {sortProducts(flopProducts).map(p => (
              <ProductCard key={p.id} product={p} variant="FLOP" />
            ))}
            {flopProducts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}