import React, { useState, useEffect } from 'react';
import { tgBase44 } from '@/api/moduleClients';
import { Loader2, TrendingUp, TrendingDown, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { differenceInDays, parseISO, subDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { subtractBusinessDays } from '@/lib/businessDays';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProduitDetailPopup from '@/components/stats/ProduitDetailPopup';
import TGDetailPopup from '@/components/stats/TGDetailPopup';
import ProductsByStatus from '@/components/suivi/ProductsByStatus';
import LabsList from '@/components/stats/LabsList';

const ProduitTGEntity = tgBase44.entities.ProduitTG;
const VentesTGEntity = tgBase44.entities.VentesTG;
const TGEntity = tgBase44.entities.TG;
const StatsProduitEntity = tgBase44.entities.StatsProduit;

function ProduitCard({ p, rank, isTop, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-2.5 py-2 border text-[11px] active:scale-95 transition-all ${isTop ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`font-extrabold shrink-0 ${isTop ? 'text-green-600' : 'text-red-400'}`}>#{rank}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate leading-tight">{p.libelle}</p>
          <p className="text-muted-foreground truncate">{p.tgNom} · {p.days}j</p>
          <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
            <strong className="text-foreground">{sortLabel(p, 'ventes')}</strong>
            <DeltaBadge delta={p.deltaVentes} />
            <span>·</span>
            <strong className="text-foreground">{sortLabel(p, 'ca')}</strong>
            <DeltaBadge delta={p.deltaCA} />
          </p>
        </div>
      </div>
    </button>
  );
}

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  const isPos = delta >= 0;
  return (
    <span className={`text-[10px] font-bold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
      {isPos ? '+' : ''}{delta.toFixed(0)}%
    </span>
  );
}

function sortLabel(p, type) {
  if (type === 'ventes') return `${p.ventes}v`;
  return `${p.ca.toFixed(0)}€`;
}

function TGCard({ t, rank, isTop, produits, sortBy, onClick }) {
  const tgProds = produits.filter(p => p.tg_id === t.id).sort((a, b) => sortBy === 'ventes' ? b.ventes - a.ventes : b.ca - a.ca);

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border overflow-hidden text-[11px] w-full text-left hover:shadow-md transition-shadow active:scale-95 ${isTop ? 'border-green-200' : 'border-red-200'}`}
    >
      <div className={`flex items-center gap-1.5 px-2.5 py-2.5 ${isTop ? 'bg-green-50' : 'bg-red-50'}`}>
        <span className={`font-extrabold shrink-0 ${isTop ? 'text-green-600' : 'text-red-400'}`}>#{rank}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate leading-tight">{t.nom}</p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">{t.ventes}v</strong> · <strong className="text-foreground">{t.ca.toFixed(0)}€</strong>
          </p>
        </div>
      </div>
    </button>
  );
}

function RankRow({ item, rank, type, produits, sortBy, onProduitClick }) {
  const [open, setOpen] = useState(false);
  if (type === 'produit') {
    return (
      <button
        onClick={() => onProduitClick && onProduitClick(item)}
        className="w-full text-left flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-[11px] hover:bg-secondary/30 transition-colors -mx-3 px-3"
      >
        <span className="font-bold text-muted-foreground w-5 shrink-0">#{rank}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{item.libelle}</p>
          <p className="text-muted-foreground">{item.tgNom} · {item.days}j</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
          <strong className="text-foreground">{sortBy === 'ventes' ? `${item.ventes}v` : `${item.ca.toFixed(0)}€`}</strong>
          <DeltaBadge delta={sortBy === 'ventes' ? item.deltaVentes : item.deltaCA} />
        </div>
      </button>
    );
  }
  // TG row with dropdown
  const tgProds = (produits || []).filter(p => p.tg_id === item.id).sort((a, b) => sortBy === 'ventes' ? b.ventes - a.ventes : b.ca - a.ca);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 py-1.5 text-[11px] hover:bg-secondary/30 transition-colors -mx-3 px-3"
      >
        <span className="font-bold text-muted-foreground w-5 shrink-0">#{rank}</span>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-foreground truncate">{item.nom}</p>
          <p className="text-muted-foreground">{item.prodCount} produit(s)</p>
        </div>
        <div className="text-right text-muted-foreground shrink-0">
          <strong className="text-foreground">{sortBy === 'ventes' ? `${item.ventes}v` : `${item.ca.toFixed(0)}€`}</strong>
        </div>
        {tgProds.length > 0 && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 text-muted-foreground ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && tgProds.length > 0 && (
        <div className="pb-1.5 pl-7 space-y-0.5">
          {tgProds.map(p => (
            <button
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                onProduitClick && onProduitClick(p);
              }}
              className="w-full flex items-center justify-between text-[10px] hover:bg-secondary/30 transition-colors text-left rounded px-1.5 py-0.5"
            >
              <span className="text-foreground truncate max-w-[60%]">{p.libelle}</span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="text-muted-foreground">{sortBy === 'ventes' ? `${p.ventes}v` : `${p.ca.toFixed(0)}€`}</span>
                <DeltaBadge delta={sortBy === 'ventes' ? p.deltaVentes : p.deltaCA} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Statistiques() {
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('ventes');
  const [produits, setProduits] = useState([]);
  const [tgs, setTGs] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedTG, setSelectedTG] = useState(null);
  const [viewMode, setViewMode] = useState('global');
  const [currentWeek, setCurrentWeek] = useState(0);

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

  useEffect(() => {
    async function load() {
      const [prods, allVentes, tgList, stats] = await Promise.all([
        ProduitTGEntity.filter({ actif: true }),
        VentesTGEntity.list('-date_vente', 10000),
        TGEntity.filter({ actif: true }),
        StatsProduitEntity.list(),
      ]);

      const today = new Date();
      
      // Filtrer les ventes selon le mode (global ou semaine)
      const now = new Date();
      const weekStart = startOfWeek(subDays(now, currentWeek * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subDays(now, currentWeek * 7), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      
      const ventes = viewMode === 'global' ? allVentes : allVentes.filter(v => v.date_vente >= weekStartStr && v.date_vente <= weekEndStr);
      
      const smap = {};
      stats.forEach(s => { smap[s.ean] = s; });
      setStatsMap(smap);

      // Map des dates d'entrée par produit (ean+tg_id)
      const dateEntreeMap = {};
      prods.forEach(p => {
        const key = `${p.ean}-${p.tg_id}`;
        dateEntreeMap[key] = p.date_entree || p.created_date?.split('T')[0];
      });

      // Agréger toutes les ventes par (ean+tg_id) par jour relatif
      const ventesParJour = {}; // key => { [relDay]: { quantite, ca_ht } }
      ventes.forEach(v => {
        const qty = v.quantite || 0;
        if (qty === 0) return;
        const key = `${v.ean}-${v.tg_id}`;
        const dateEntreeStr = dateEntreeMap[key];
        if (!dateEntreeStr) return;
        const relDay = differenceInDays(parseISO(v.date_vente), parseISO(dateEntreeStr));
        if (!ventesParJour[key]) ventesParJour[key] = {};
        if (!ventesParJour[key][relDay]) ventesParJour[key][relDay] = { quantite: 0, ca_ht: 0 };
        ventesParJour[key][relDay].quantite += qty;
        ventesParJour[key][relDay].ca_ht += Number(v.ca_ht || 0);
      });

      // Lissage des pics — même algorithme que le popup (lissage par voisins, jour par jour)
      const ventesLissees = {};
      Object.entries(ventesParJour).forEach(([key, byDay]) => {
        const allVals = Object.values(byDay).map(d => d.quantite).filter(v => v > 0).sort((a, b) => a - b);
        const median = allVals.length > 0 ? allVals[Math.floor(allVals.length / 2)] : 0;
        const threshold = Math.max(median * 3, 5);

        const lissed = {};
        Object.entries(byDay).forEach(([dStr, v]) => { lissed[parseInt(dStr)] = { ...v }; });

        if (median > 0) {
          Object.entries(byDay).forEach(([dStr, v]) => {
            const d = parseInt(dStr);
            const qty = v.quantite;
            const prevQty = byDay[d - 1]?.quantite || 0;
            const nextQty = byDay[d + 1]?.quantite || 0;
            const neighborAvg = (prevQty + nextQty) / 2;
            if (qty >= threshold && (neighborAvg === 0 || qty > neighborAvg * 3)) {
              lissed[d] = {
                quantite: neighborAvg > 0 ? Math.round(neighborAvg) : 0,
                ca_ht: neighborAvg > 0 ? (v.ca_ht * neighborAvg / qty) : 0,
              };
            }
          });
        }

        ventesLissees[key] = lissed;
      });

      const tgMap = {};
      tgList.forEach(t => { tgMap[t.id] = t.nom; });

      const prodStats = prods.map(p => {
        const key = `${p.ean}-${p.tg_id}`;
        const byDay = ventesLissees[key] || {};
        const dateEntreeStr = p.date_entree || p.created_date?.split('T')[0];
        const days = dateEntreeStr ? Math.max(1, differenceInDays(today, parseISO(dateEntreeStr))) : 1;
        // Fenêtre de comparaison = même durée que le temps en TG, max 21j
        const compWindow = Math.min(days, 21);

        // Total ventes en TG : J0 → J+days (même durée que compWindow pour comparaison équitable)
        let totalQty = 0, totalCA = 0, totalQtyBefore = 0, totalCABefore = 0;
        for (let d = 0; d < compWindow; d++) {
          totalQty += byDay[d]?.quantite || 0;
          totalCA += byDay[d]?.ca_ht || 0;
        }
        // Période avant : J-compWindow → J-1
        for (let d = -compWindow; d < 0; d++) {
          totalQtyBefore += byDay[d]?.quantite || 0;
          totalCABefore += byDay[d]?.ca_ht || 0;
        }

        // Ventes totales sur les 14 jours ouvrés précédents le scan
        const dateEntreeParsed = parseISO(dateEntreeStr);
        const start14jOuvres = subtractBusinessDays(dateEntreeParsed, 14);
        let ventesBefore14j = 0;
        Object.entries(byDay).forEach(([dStr, v]) => {
          const d = parseInt(dStr);
          if (d < 0) {
            const actualDate = new Date(dateEntreeParsed.getTime() + d * 86400000);
            if (actualDate >= start14jOuvres && actualDate.getDay() !== 0) {
              ventesBefore14j += v.quantite;
            }
          }
        });

        // Total réel en TG (tous les jours depuis J0, pour affichage et calcul delta)
        let ventesTotales = 0, caTotale = 0;
        Object.entries(byDay).forEach(([dStr, v]) => {
          if (parseInt(dStr) >= 0) { ventesTotales += v.quantite; caTotale += v.ca_ht; }
        });

        // Delta : (ventes totales en TG - ventes 14j ouvrés avant) / ventes 14j ouvrés avant * 100
        const deltaVentes = ventesBefore14j > 0 ? ((ventesTotales - ventesBefore14j) / ventesBefore14j * 100) : null;
        const deltaCA = totalCABefore > 0 ? ((caTotale - totalCABefore) / totalCABefore * 100) : null;

        return {
          id: p.id,
          ean: p.ean,
          tg_id: p.tg_id,
          tgNom: tgMap[p.tg_id] || '?',
          libelle: smap[p.ean]?.libelle || p.libelle || p.ean,
          date_entree: p.date_entree,
          created_date: p.created_date,
          days,
          ventes: ventesTotales,
          ca: caTotale,
          deltaVentes,
          deltaCA,
          ventesBefore14j,
        };
      });
      setProduits(prodStats);

      // Calculer évolution par TG sur 3 dernières semaines
      const ventesParJourTG = {}; // key => { [relDay]: quantite }
      ventes.forEach(v => {
        const qty = v.quantite || 0;
        if (qty === 0) return;
        const key = `${v.ean}-${v.tg_id}`;
        const dateEntreeStr = dateEntreeMap[key];
        if (!dateEntreeStr) return;
        const relDay = differenceInDays(parseISO(v.date_vente), parseISO(dateEntreeStr));
        if (!ventesParJourTG[v.tg_id]) ventesParJourTG[v.tg_id] = {};
        if (!ventesParJourTG[v.tg_id][relDay]) ventesParJourTG[v.tg_id][relDay] = 0;
        ventesParJourTG[v.tg_id][relDay] += qty;
      });

      const tgStats = {};
      tgList.forEach(t => { 
        tgStats[t.id] = { id: t.id, nom: t.nom, ventes: 0, ca: 0, prodCount: 0, evolution: null }; 
      });
      prodStats.forEach(p => {
        if (tgStats[p.tg_id]) {
          tgStats[p.tg_id].ventes += p.ventes;
          tgStats[p.tg_id].ca += p.ca;
          tgStats[p.tg_id].prodCount++;
        }
      });

      // Calculer évolution 20% pour chaque TG
      Object.keys(tgStats).forEach(tgId => {
        const byDay = ventesParJourTG[tgId] || {};
        let recent = 0, before = 0;
        for (let d = 0; d <= 7; d++) recent += byDay[d] || 0;
        for (let d = 8; d <= 21; d++) before += byDay[d] || 0;
        const evo = before > 0 ? ((recent - before) / before * 100) : null;
        tgStats[tgId].evolution = evo;
      });

      setTGs(Object.values(tgStats));
      setLoading(false);
    }
    load();
  }, [viewMode, currentWeek]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const sorted = (arr) => [...arr].sort((a, b) => sortBy === 'ventes' ? b.ventes - a.ventes : b.ca - a.ca);
  const sortedProduits = sorted(produits);
  const eligibleFlop = sortedProduits.filter(p => p.days > 1);
  const top3P = sortedProduits.slice(0, 3);
  const flop3P = eligibleFlop.length > 3 ? eligibleFlop.slice(-3).reverse() : eligibleFlop.slice(0, 3).reverse();
  const top3Ids = new Set(top3P.map(p => p.id));
  const flop3Ids = new Set(flop3P.map(p => p.id));
  const resteP = sortedProduits.filter(p => !top3Ids.has(p.id) && !flop3Ids.has(p.id));

  const sortedTGs = sorted(tgs);
  const top3TG = sortedTGs.slice(0, 3);
  const eligibleFlopTG = sortedTGs.filter(t => {
    const tgProds = produits.filter(p => p.tg_id === t.id);
    return tgProds.length > 0 && tgProds.every(p => p.days > 1);
  });
  const flop3TG = eligibleFlopTG.length > 3 ? eligibleFlopTG.slice(-3).reverse() : [];
  
  // TG avec évolution >= 20%
  const evolutionTG = sortedTGs.filter(t => t.evolution !== null && t.evolution >= 20).slice(0, 5);
  
  const top3TGIds = new Set(top3TG.map(t => t.id));
  const flop3TGIds = new Set(flop3TG.map(t => t.id));
  const evolutionTGIds = new Set(evolutionTG.map(t => t.id));
  const resteTG = sortedTGs.filter(t => !top3TGIds.has(t.id) && !flop3TGIds.has(t.id) && !evolutionTGIds.has(t.id));

  return (
    <div className="space-y-4 pt-4 pb-8">
      {selectedProduit && (
        <ProduitDetailPopup produit={selectedProduit} onClose={() => setSelectedProduit(null)} allProduits={produits} currentIndex={selectedIndex} onNavigate={handleNavigateProduit} />
      )}
      {selectedTG && (
        <TGDetailPopup tg={selectedTG} produits={produits} onClose={() => setSelectedTG(null)} onProduitClick={handleSelectProduit} />
      )}
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Statistiques</h2>
        <p className="text-sm text-muted-foreground italic">Classement depuis mise en TG</p>
      </div>

      {/* Filtres semaine/global */}
      <div className="flex items-center gap-2 justify-center">
        <button
          onClick={() => setViewMode('global')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'global' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
        >
          Global
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'week' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
        >
          Par semaine
        </button>
      </div>

      {viewMode === 'week' && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setCurrentWeek(currentWeek + 1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            {currentWeek === 0 ? 'Semaine actuelle' : `Semaine -${currentWeek}`} ({format(startOfWeek(subDays(new Date(), currentWeek * 7), { weekStartsOn: 1 }), 'dd/MM')} à {format(endOfWeek(subDays(new Date(), currentWeek * 7), { weekStartsOn: 1 }), 'dd/MM')})
          </span>
          <button onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))} disabled={currentWeek === 0} className="p-1.5 rounded-full hover:bg-secondary transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs text-muted-foreground">Trier par :</span>
        <button onClick={() => setSortBy('ventes')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy === 'ventes' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>Ventes</button>
        <button onClick={() => setSortBy('ca')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy === 'ca' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>CA HT</button>
      </div>

      <Tabs defaultValue="statuts">
        <TabsList className="bg-muted w-full">
          <TabsTrigger value="statuts" className="flex-1 text-xs">Laboratoires</TabsTrigger>
          <TabsTrigger value="produits" className="flex-1 text-xs">Par produit</TabsTrigger>
          <TabsTrigger value="tg" className="flex-1 text-xs">Par TG</TabsTrigger>
        </TabsList>

        <TabsContent value="statuts" className="mt-3">
          <LabsList produits={sortedProduits} statsMap={statsMap} />
        </TabsContent>

        <TabsContent value="produits" className="mt-3 space-y-4">
          {sortedProduits.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune donnée</p>}

          {(top3P.length > 0 || flop3P.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {top3P.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Top 3
                  </p>
                  {top3P.map((p, i) => <ProduitCard key={p.id} p={p} rank={i + 1} isTop={true} onClick={() => handleSelectProduit(p)} />)}
                </div>
              )}
              {flop3P.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Flop 3
                  </p>
                  {flop3P.map((p, i) => <ProduitCard key={p.id} p={p} rank={sortedProduits.length - i} isTop={false} onClick={() => handleSelectProduit(p)} />)}
                </div>
              )}
            </div>
          )}

          {resteP.length > 0 && (
            <div className="bg-white border border-border rounded-xl px-3 py-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-2 pb-1">Classement complet</p>
              {resteP.map((p, i) => (
                <RankRow key={p.id} item={p} rank={top3P.length + i + 1} type="produit" sortBy={sortBy} onProduitClick={handleSelectProduit} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tg" className="mt-3 space-y-4">
          {sortedTGs.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune donnée</p>}

          {(top3TG.length > 0 || flop3TG.length > 0 || evolutionTG.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {top3TG.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Top 3
                  </p>
                  {top3TG.map((t, i) => <TGCard key={t.id} t={t} rank={i + 1} isTop={true} produits={produits} sortBy={sortBy} onClick={() => setSelectedTG(t)} />)}
                </div>
              )}
              {flop3TG.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Flop 3
                  </p>
                  {flop3TG.map((t, i) => <TGCard key={t.id} t={t} rank={sortedTGs.length - i} isTop={false} produits={produits} sortBy={sortBy} onClick={() => setSelectedTG(t)} />)}
                </div>
              )}
              {evolutionTG.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +20% Évol.
                  </p>
                  {evolutionTG.map((t, i) => <TGCard key={t.id} t={t} rank={i + 1} isTop={true} produits={produits} sortBy={sortBy} onClick={() => setSelectedTG(t)} />)}
                </div>
              )}
            </div>
          )}

          {resteTG.length > 0 && (
           <div className="bg-white border border-border rounded-xl px-3 py-1">
             <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-2 pb-1">Autres</p>
             {resteTG.map((t, i) => (
               <button key={t.id} onClick={() => setSelectedTG(t)} className="w-full flex items-center gap-2 py-1.5 text-[11px] hover:bg-secondary/30 transition-colors -mx-3 px-3 text-left">
                 <span className="font-bold text-muted-foreground w-5 shrink-0">#{top3TG.length + (flop3TG.length > 0 ? flop3TG.length : 0) + (evolutionTG.length > 0 ? evolutionTG.length : 0) + i + 1}</span>
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-foreground truncate">{t.nom}</p>
                   <p className="text-muted-foreground">{t.prodCount} produit(s)</p>
                 </div>
                 <div className="text-right text-muted-foreground shrink-0">
                   <strong className="text-foreground">{sortBy === 'ventes' ? `${t.ventes}v` : `${t.ca.toFixed(0)}€`}</strong>
                 </div>
               </button>
             ))}
           </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
