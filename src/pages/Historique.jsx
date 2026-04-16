import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const ProduitTGEntity = base44.entities.ProduitTG;
const TGEntity = base44.entities.TG;
const VentesTGEntity = base44.entities.VentesTG;
const StatsProduitEntity = base44.entities.StatsProduit;

export default function Historique() {
  const [items, setItems] = useState([]);
  const [tgMap, setTgMap] = useState({});
  const [ventesMap, setVentesMap] = useState({});
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prods, tgs, ventes, stats] = await Promise.all([
        ProduitTGEntity.filter({ actif: false }),
        TGEntity.list(),
        VentesTGEntity.list(),
        StatsProduitEntity.list(),
      ]);

      const smap = {};
      stats.forEach(s => { smap[s.ean] = s; });
      setStatsMap(smap);

      const tmap = {};
      tgs.forEach(t => { tmap[t.id] = t.nom; });
      setTgMap(tmap);

      // Agréger ventes par ean+tg_id selon la période d'activité
      const vmap = {};
      prods.forEach(p => {
        const key = `${p.ean}-${p.tg_id}`;
        vmap[key] = { quantite: 0, ca_ht: 0 };
      });
      
      ventes.forEach(v => {
        const key = `${v.ean}-${v.tg_id}`;
        const prod = prods.find(p => p.ean === v.ean && p.tg_id === v.tg_id);
        if (!prod) return;
        
        // Vérifier si la vente est dans la période d'activité
        const dateEntree = prod.date_entree || prod.created_date?.split('T')[0];
        const dateSortie = prod.date_sortie;
        const dateVente = v.date_vente;
        
        if (dateEntree && dateVente >= dateEntree && (!dateSortie || dateVente <= dateSortie)) {
          vmap[key].quantite += v.quantite || 0;
          vmap[key].ca_ht += Number(v.ca_ht || 0);
        }
      });
      setVentesMap(vmap);

      const sorted = prods.sort((a, b) => {
        if (!a.date_sortie) return 1;
        if (!b.date_sortie) return -1;
        return b.date_sortie.localeCompare(a.date_sortie);
      });
      setItems(sorted);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Historique</h2>
        <p className="text-sm text-muted-foreground italic">Produits retirés des TG</p>
      </div>

      {items.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Aucun historique</p>
      ) : (
        <div className="space-y-2">
          {items.map(p => {
           const duree = p.date_sortie && p.date_entree
             ? differenceInDays(parseISO(p.date_sortie), parseISO(p.date_entree))
             : 0;
           const key = `${p.ean}-${p.tg_id}`;
           const vente = ventesMap[key] || { quantite: 0, ca_ht: 0 };
           const ventesParJour = duree > 0 ? (vente.quantite / duree).toFixed(2) : '—';
           const caParJour = duree > 0 ? (vente.ca_ht / duree).toFixed(2) : '—';

           return (
             <div key={p.id} className="bg-white border border-border rounded-xl p-3 shadow-sm">
               <div className="flex items-start justify-between gap-2">
                 <div className="min-w-0">
                   <p className="text-sm font-medium text-foreground truncate">
                     {statsMap[p.ean]?.libelle || p.libelle || p.ean}
                   </p>
                   <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.ean}</p>
                 </div>
                 <div className="flex flex-col items-end gap-1 shrink-0">
                   <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-md font-medium">
                     {duree}j
                   </span>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-muted-foreground">
                 <div>
                   <p className="font-semibold text-foreground">{vente.quantite}</p>
                   <p>ventes</p>
                 </div>
                 <div className="text-right">
                   <p className="font-semibold text-foreground">{Number(vente.ca_ht).toFixed(2)}€</p>
                   <p>CA HT</p>
                 </div>
                 <div>
                   <p className="font-semibold text-foreground">{ventesParJour}</p>
                   <p>ventes/j</p>
                 </div>
                 <div className="text-right">
                   <p className="font-semibold text-foreground">{caParJour}€</p>
                   <p>CA/j</p>
                 </div>
               </div>
               <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                 <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                   {tgMap[p.tg_id] || 'TG inconnue'}
                 </span>
                 <span>{p.date_entree}</span>
                 <ArrowRight className="w-3 h-3" />
                 <span>{p.date_sortie || '—'}</span>
               </div>
             </div>
           );
          })}
        </div>
      )}
    </div>
  );
}