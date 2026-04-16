import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ProduitDetailPopup from '@/components/stats/ProduitDetailPopup';

export default function LabsList({ produits, statsMap }) {
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sortBy, setSortBy] = useState('days'); // 'days' | 'evolution'

  const sortArr = arr => [...arr].sort((a, b) =>
    sortBy === 'days' ? b.days - a.days : b.deltaVentes - a.deltaVentes
  );

  const topProds = sortArr(produits.filter(p => p.deltaVentes !== null && p.deltaVentes !== undefined && p.deltaVentes >= 20));
  const middleProds = sortArr(produits.filter(p => {
    const evo = p.deltaVentes ?? null;
    return evo !== null && evo >= 5 && evo < 20;
  }));
  const flopProds = sortArr(produits.filter(p => p.deltaVentes !== null && p.deltaVentes !== undefined && p.deltaVentes < 5));

  const handleSelectProduit = (p) => {
    setSelectedProduit(p);
    setSelectedIndex(produits.findIndex(prod => prod.id === p.id));
  };

  const handleNavigateProduit = (newIndex) => {
    if (newIndex >= 0 && newIndex < produits.length) {
      setSelectedProduit(produits[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const ProdCard = ({ p, isTop }) => {
    const stats = statsMap[p.ean] || {};
    const libelle = stats.libelle || p.libelle || p.ean;
    const bgClass = isTop === true ? 'bg-green-50 border-green-200' : isTop === false ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
    const textClass = isTop === true ? 'text-green-600' : isTop === false ? 'text-red-500' : 'text-gray-600';

    return (
      <button
        onClick={() => handleSelectProduit(p)}
        className={`w-full text-left border rounded-lg p-2.5 ${bgClass} hover:shadow-md transition-shadow active:scale-95`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{libelle}</p>
            <p className="text-[10px] font-bold text-foreground mt-0.5">{p.tgNom} • <span className="font-bold">{p.days}j en TG</span></p>
          </div>
          <span className={`text-xs font-bold shrink-0 ${textClass}`}>
            {p.deltaVentes >= 0 ? '+' : ''}{p.deltaVentes.toFixed(0)}%
          </span>
        </div>
      </button>
    );
  };

  return (
    <>
      {selectedProduit && (
        <ProduitDetailPopup produit={selectedProduit} onClose={() => setSelectedProduit(null)} allProduits={produits} currentIndex={selectedIndex} onNavigate={handleNavigateProduit} />
      )}
      <div className="flex items-center gap-2 justify-end mb-2">
        <span className="text-[11px] text-muted-foreground">Trier par :</span>
        <button onClick={() => setSortBy('days')} className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${sortBy === 'days' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Jours en TG</button>
        <button onClick={() => setSortBy('evolution')} className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${sortBy === 'evolution' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Évolution</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* TOP */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-600">+20% ({topProds.length})</span>
        </div>
        <div className="space-y-1.5">
          {topProds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
          ) : (
            topProds.map(p => <ProdCard key={p.id} p={p} isTop={true} />)
          )}
        </div>
      </div>

      {/* MIDDLE */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <Minus className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-bold text-gray-600">[5%, 20%[ ({middleProds.length})</span>
        </div>
        <div className="space-y-1.5">
          {middleProds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
          ) : (
            middleProds.map(p => <ProdCard key={p.id} p={p} isTop={null} />)
          )}
        </div>
      </div>

      {/* FLOP */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600">&lt;5% ({flopProds.length})</span>
        </div>
        <div className="space-y-1.5">
          {flopProds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun produit</p>
          ) : (
            flopProds.map(p => <ProdCard key={p.id} p={p} isTop={false} />)
          )}
        </div>
      </div>
      </div>
    </>
  );
}