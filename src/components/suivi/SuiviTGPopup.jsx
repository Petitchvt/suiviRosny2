import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ProduitDetailPopup from '@/components/stats/ProduitDetailPopup';

function StatutBadge({ statut, delta }) {
  if (statut === 'TOP') return <span className="text-xs font-bold text-green-600">+{delta?.toFixed(0)}%</span>;
  if (statut === 'FLOP') return <span className="text-xs font-bold text-red-500">{delta?.toFixed(0)}%</span>;
  if (statut === 'MIDDLE') return <span className="text-xs font-bold text-gray-500">{delta >= 0 ? '+' : ''}{delta?.toFixed(0)}%</span>;
  return <span className="text-xs text-muted-foreground">—</span>;
}

function ProdCard({ p, onClick }) {
  const bgClass = p.statut === 'TOP' ? 'bg-green-50 border-green-200' : p.statut === 'FLOP' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-lg p-2.5 ${bgClass} hover:shadow-md transition-shadow active:scale-95`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{p.libelle}</p>
          <p className="text-[10px] text-muted-foreground">{p.days}j en TG</p>
        </div>
        <StatutBadge statut={p.statut} delta={p.deltaVentes} />
      </div>
    </button>
  );
}

export default function SuiviTGPopup({ tgName, tgCa, produits, allProduits, onClose }) {
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const topProds = produits.filter(p => p.statut === 'TOP').sort((a, b) => b.deltaVentes - a.deltaVentes);
  const middleProds = produits.filter(p => p.statut === 'MIDDLE').sort((a, b) => b.deltaVentes - a.deltaVentes);
  const flopProds = produits.filter(p => p.statut === 'FLOP').sort((a, b) => a.deltaVentes - b.deltaVentes);
  const noDataProds = produits.filter(p => p.statut === null);

  const handleSelect = (p) => {
    setSelectedProduit(p);
    setSelectedIndex(allProduits.findIndex(ap => ap.id === p.id));
  };

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < allProduits.length) {
      setSelectedProduit(allProduits[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 pb-5 space-y-3 max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground">{tgName}</h3>
              <p className="text-sm font-bold italic text-muted-foreground">{tgCa.toFixed(0)} € CA HT</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {produits.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun produit actif</p>
          )}

          {/* TOP */}
          {topProds.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[11px] font-bold text-green-600">TOP — ≥ +20% ({topProds.length})</span>
              </div>
              {topProds.map(p => <ProdCard key={p.id} p={p} onClick={() => handleSelect(p)} />)}
            </div>
          )}

          {/* MIDDLE */}
          {middleProds.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg">
                <Minus className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-600">MIDDLE — [5%, 20%[ ({middleProds.length})</span>
              </div>
              {middleProds.map(p => <ProdCard key={p.id} p={p} onClick={() => handleSelect(p)} />)}
            </div>
          )}

          {/* FLOP */}
          {flopProds.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[11px] font-bold text-red-500">FLOP — &lt; +5% ({flopProds.length})</span>
              </div>
              {flopProds.map(p => <ProdCard key={p.id} p={p} onClick={() => handleSelect(p)} />)}
            </div>
          )}

          {/* Pas de données */}
          {noDataProds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase">Sans données ({noDataProds.length})</p>
              {noDataProds.map(p => <ProdCard key={p.id} p={p} onClick={() => handleSelect(p)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Second popup produit */}
      {selectedProduit && (
        <ProduitDetailPopup
          produit={selectedProduit}
          onClose={() => setSelectedProduit(null)}
          allProduits={allProduits}
          currentIndex={selectedIndex}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}