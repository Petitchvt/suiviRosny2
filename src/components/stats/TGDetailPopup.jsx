import React, { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { tgBase44 } from '@/api/moduleClients';
import { differenceInDays, parseISO } from 'date-fns';

const VentesTGEntity = tgBase44.entities.VentesTG;

export default function TGDetailPopup({ tg, produits = [], onClose, onProduitClick }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVentes: 0, totalCA: 0, avgParJour: 0, evolution: null });
  const [tgProds, setTgProds] = useState([]);

  const tgProduits = produits.filter(p => p.tg_id === tg.id);

  useEffect(() => {
    async function load() {
      // Récupérer les ventes des 21 derniers jours
      const ventes = await VentesTGEntity.filter({ tg_id: tg.id }, '-date_vente', 1000);
      const today = new Date();
      const threeWeeksAgo = new Date(today.getTime() - 21 * 86400000);

      // Ventes récentes (derniers 7 jours)
      const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
      const ventesRecentes = ventes.filter(v => new Date(v.date_vente) >= sevenDaysAgo);
      let recentTotal = 0, recentCA = 0;
      ventesRecentes.forEach(v => {
        recentTotal += v.quantite || 0;
        recentCA += Number(v.ca_ht || 0);
      });

      // Ventes 3 semaines avant (J-21 à J-14)
      const fourteenDaysAgo = new Date(today.getTime() - 14 * 86400000);
      const ventesAvant = ventes.filter(v => {
        const d = new Date(v.date_vente);
        return d >= threeWeeksAgo && d < fourteenDaysAgo;
      });
      let beforeTotal = 0;
      ventesAvant.forEach(v => {
        beforeTotal += v.quantite || 0;
      });

      const evolution = beforeTotal > 0 ? ((recentTotal - beforeTotal) / beforeTotal * 100) : null;
      const avgParJour = recentTotal > 0 ? (recentTotal / 7).toFixed(1) : 0;

      setStats({
        totalVentes: recentTotal,
        totalCA: recentCA,
        avgParJour,
        evolution,
      });

      // Agréger les stats par produit
      const prodStats = {};
      tgProduits.forEach(p => {
        prodStats[p.id] = { quantite: 0, ca_ht: 0 };
      });

      ventesRecentes.forEach(v => {
        const prod = tgProduits.find(p => p.ean === v.ean);
        if (prod) {
          prodStats[prod.id].quantite += v.quantite || 0;
          prodStats[prod.id].ca_ht += Number(v.ca_ht || 0);
        }
      });

      const prods = tgProduits.map(p => ({
        ...p,
        ...prodStats[p.id],
      })).sort((a, b) => b.quantite - a.quantite);

      setTgProds(prods);
      setLoading(false);
    }
    load();
  }, [tg.id, produits]);

  const { totalVentes, totalCA, avgParJour, evolution } = stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-4 pb-5 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground truncate">{tg.nom}</h3>
            <p className="text-xs text-muted-foreground">{tgProduits.length} produit(s) actif(s)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Résumé chiffres */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">7 derniers jours</p>
                <p className="text-lg font-bold text-foreground">{totalVentes}</p>
                <p className="text-[10px] text-muted-foreground">{avgParJour}/j</p>
              </div>
              <div className="bg-primary/8 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">CA HT</p>
                <p className="text-lg font-bold text-foreground">{totalCA.toFixed(0)}€</p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${evolution === null ? 'bg-secondary/50' : evolution >= 20 ? 'bg-green-50' : evolution >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <p className="text-[10px] text-muted-foreground">Évolution</p>
                {evolution === null ? (
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                ) : (
                  <div className="flex items-center justify-center gap-0.5">
                    {evolution >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    <p className={`text-lg font-bold ${evolution >= 20 ? 'text-green-600' : evolution >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {evolution >= 0 ? '+' : ''}{evolution.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Produits */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Produits (7 derniers jours)</p>
              <div className="space-y-1">
                {tgProds.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onProduitClick && onProduitClick(p)}
                    className="w-full flex items-center justify-between bg-white border border-border rounded-lg p-2 hover:bg-primary/5 hover:border-primary/50 transition-all active:scale-95 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate">{p.libelle || p.ean}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{p.ean}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-foreground">{p.quantite}v</p>
                      <p className="text-[9px] text-muted-foreground">{p.ca_ht.toFixed(0)}€</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
