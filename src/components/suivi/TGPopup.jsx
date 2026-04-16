import React, { useEffect } from 'react';
import { X, Package, TrendingUp, DollarSign, AlertTriangle, Sparkles } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function TGPopup({ tgName, products, ventes, statsMap, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const today = new Date();

  // Ventes depuis mise en TG (toutes, pas juste 7j)
  const ventesMap = {};
  ventes.forEach(v => {
    if (!ventesMap[v.ean]) ventesMap[v.ean] = { quantite: 0, ca_ht: 0 };
    ventesMap[v.ean].quantite += v.quantite || 0;
    ventesMap[v.ean].ca_ht += Number(v.ca_ht || 0);
  });

  const totalVentes = ventes.reduce((s, v) => s + (v.quantite || 0), 0);
  const totalCA = ventes.reduce((s, v) => s + Number(v.ca_ht || 0), 0);

  const oldCount = products.filter(p => differenceInDays(today, parseISO(p.date_entree)) >= 30).length;
  const newCount = products.filter(p => differenceInDays(today, parseISO(p.date_entree)) <= 7).length;

  // Moyenne CA/jour sur toutes les TG (somme jours actifs)
  const totalDays = products.reduce((s, p) => s + Math.max(1, differenceInDays(today, parseISO(p.date_entree))), 0);
  const avgCAPerDay = totalDays > 0 ? totalCA / totalDays : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 pb-6 space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-lg font-bold text-foreground">{tgName}</h3>
            <p className="text-xs text-muted-foreground">{products.length} produit(s) actif(s)</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary/8 rounded-xl p-3 text-center">
            <Package className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{products.length}</p>
            <p className="text-[10px] text-muted-foreground">Produits</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalVentes}</p>
            <p className="text-[10px] text-muted-foreground">Ventes TG</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <DollarSign className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalCA.toFixed(0)}€</p>
            <p className="text-[10px] text-muted-foreground">{avgCAPerDay.toFixed(1)}€/j moy.</p>
          </div>
        </div>

        {/* Badges alertes */}
        <div className="flex gap-2 flex-wrap">
          {newCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              <Sparkles className="w-3 h-3" /> {newCount} nouveau(x) cette semaine
            </span>
          )}
          {oldCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" /> {oldCount} produit(s) ≥30j
            </span>
          )}
        </div>

        {/* Liste produits */}
        {products.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produits</p>
            {products.map(p => {
              const stats = statsMap?.[p.ean] || {};
              const libelle = stats.libelle || p.libelle || p.ean;
              const days = Math.max(1, differenceInDays(today, parseISO(p.date_entree)));
              const vente = ventesMap[p.ean] || { quantite: 0, ca_ht: 0 };
              const isOld = days >= 30;
              const isNew = days <= 7;
              const avgVentes = vente.quantite > 0 ? (vente.quantite / days).toFixed(1) : null;
              const avgCA = vente.ca_ht > 0 ? (vente.ca_ht / days).toFixed(2) : null;

              return (
                <div key={p.id} className={`rounded-xl px-3 py-2.5 border text-sm ${isOld ? 'bg-orange-50 border-orange-200' : isNew ? 'bg-green-50 border-green-200' : 'bg-secondary/30 border-border'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate text-xs">{libelle}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.ean}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${isOld ? 'bg-orange-100 text-orange-600' : isNew ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                      {days}j
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 mt-1.5 text-[10px] text-muted-foreground">
                    {stats.stock_actuel !== undefined && (
                      <span>Stock : <strong className="text-foreground">{stats.stock_actuel}</strong></span>
                    )}
                    {vente.quantite > 0 && (
                      <span>Ventes : <strong className="text-foreground">{vente.quantite}</strong>
                        {avgVentes && <span className="text-muted-foreground"> ({avgVentes}/j)</span>}
                      </span>
                    )}
                    {vente.ca_ht > 0 && (
                      <span>CA : <strong className="text-foreground">{Number(vente.ca_ht).toFixed(2)}€</strong>
                        {avgCA && <span className="text-muted-foreground"> ({avgCA}€/j)</span>}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Aucun produit actif sur cette TG
          </div>
        )}
      </div>
    </div>
  );
}