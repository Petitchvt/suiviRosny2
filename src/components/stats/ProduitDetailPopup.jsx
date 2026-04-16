import React, { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { tgBase44 } from '@/api/moduleClients';
import { differenceInDays, parseISO, subDays, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { subtractBusinessDays } from '@/lib/businessDays';

const VentesTGEntity = tgBase44.entities.VentesTG;

export default function ProduitDetailPopup({ produit, onClose, allProduits = [], currentIndex = -1, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [compareMode, setCompareMode] = useState('full14'); // 'same' = même durée, 'full14' = 14j ouvrés complets
  const [stats, setStats] = useState({ beforeTotal: 0, afterTotal: 0, daysInTG: 0, delta: null, before14jTotal: 0 });

  useEffect(() => {
    async function load() {
      const ventes = await VentesTGEntity.filter({ ean: produit.ean, tg_id: produit.tg_id }, '-date_vente', 10000);

      const dateEntreeStr = produit.date_entree || produit.created_date?.split('T')[0];
      if (!dateEntreeStr) { setLoading(false); return; }
      const dateEntree = parseISO(dateEntreeStr);
      const today = new Date();

      // Jours écoulés depuis mise en TG (minimum 1)
      const daysInTG = Math.max(1, differenceInDays(today, dateEntree));
      // Fenêtre de comparaison = min(daysInTG, 21)
      const window = Math.min(daysInTG, 21);

      const rawMap = {};
      ventes.forEach(v => {
        const dateV = parseISO(v.date_vente);
        const relDay = differenceInDays(dateV, dateEntree);
        if (relDay >= -21 && relDay <= daysInTG) {
          rawMap[relDay] = (rawMap[relDay] || 0) + (v.quantite || 0);
        }
      });

      // Détection et lissage des pics d'export (outliers)
      // Un pic = valeur > 3× la médiane des jours non-nuls, et > 3× ses voisins
      const allVals = Object.values(rawMap).filter(v => v > 0).sort((a, b) => a - b);
      const median = allVals.length > 0 ? allVals[Math.floor(allVals.length / 2)] : 0;
      const threshold = Math.max(median * 3, 5); // au moins 5 ventes pour qu'un seuil soit pertinent

      const ventesMap = { ...rawMap };
      if (median > 0) {
        Object.keys(rawMap).forEach(dStr => {
          const d = parseInt(dStr);
          const val = rawMap[d];
          const prev = rawMap[d - 1] || 0;
          const next = rawMap[d + 1] || 0;
          const neighborAvg = (prev + next) / 2;
          // C'est un pic si > seuil ET > 3× la moyenne des voisins
          if (val >= threshold && (neighborAvg === 0 || val > neighborAvg * 3)) {
            // Lisser : moyenne des voisins, ou 0 si pas de voisins
            ventesMap[d] = neighborAvg > 0 ? Math.round(neighborAvg) : 0;
          }
        });
      }

      // Graphique : J-21 à J+21 (étalon fixe pour la lisibilité)
      const data = [];
      for (let d = -21; d <= 21; d++) {
        data.push({
          day: d,
          label: d === 0 ? 'J0' : (d > 0 ? `+${d}` : `${d}`),
          ventes: ventesMap[d] || 0,
          outlier: rawMap[d] !== ventesMap[d], // marqueur si lissé
        });
      }
      setChartData(data);

      // Stats : avant = fenêtre de même durée que daysInTG (max 21j)
      let beforeTotal = 0;
      for (let d = -window; d < 0; d++) beforeTotal += ventesMap[d] || 0;

      // Après = toutes les ventes depuis mise en TG (lissées)
      let afterTotal = 0;
      for (let d = 0; d <= daysInTG; d++) afterTotal += ventesMap[d] || 0;

      // 14 jours ouvrés complets précédents le scan
      const start14jOuvres = subtractBusinessDays(dateEntree, 14);
      let before14jTotal = 0;
      for (let d = -60; d < 0; d++) {
        const actualDate = new Date(dateEntree.getTime() + d * 86400000);
        if (actualDate >= start14jOuvres && actualDate.getDay() !== 0) {
          before14jTotal += ventesMap[d] || 0;
        }
      }

      const avgBefore = beforeTotal / window;
      const avgAfter = afterTotal / daysInTG;
      const delta = avgBefore > 0 ? ((avgAfter - avgBefore) / avgBefore * 100) : null;

      // Même formule que la liste : (ventes totales en TG - ventes 14j ouvrés avant) / ventes 14j ouvrés avant * 100
      const delta14j = before14jTotal > 0 ? ((afterTotal - before14jTotal) / before14jTotal * 100) : null;

      setStats({ beforeTotal, afterTotal, daysInTG, window, avgBefore, avgAfter, delta, before14jTotal, avg14j, delta14j });
      setLoading(false);
    }
    load();
  }, [produit]);

  const { beforeTotal, afterTotal, daysInTG, window: compWindow, avgBefore, avgAfter, delta, before14jTotal, avg14j, delta14j } = stats;

  const displayBefore = compareMode === 'same' ? beforeTotal : before14jTotal;
  const displayAvgBefore = compareMode === 'same' ? avgBefore : avg14j;
  const displayDelta = compareMode === 'same' ? delta : delta14j;
  const displayBeforeLabel = compareMode === 'same' ? `Avant (${compWindow}j)` : `14j ouvrés`;

  const hasPrev = allProduits.length > 0 && currentIndex > 0;
  const hasNext = allProduits.length > 0 && currentIndex < allProduits.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 pb-5 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 shrink-0">
            {hasPrev && (
              <button
                onClick={() => onNavigate && onNavigate(currentIndex - 1)}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => onNavigate && onNavigate(currentIndex + 1)}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">{produit.libelle}</h3>
            <p className="text-[11px] text-muted-foreground font-mono">{produit.ean} · {produit.tgNom} · Entrée J0 = {produit.date_entree || produit.created_date?.split('T')[0] || '?'}</p>
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
            {/* Toggle mode comparaison */}
            <div className="flex items-center gap-1.5 justify-center bg-secondary/50 rounded-xl p-1">
              <button
                onClick={() => setCompareMode('same')}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${compareMode === 'same' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
              >
                Même période
              </button>
              <button
                onClick={() => setCompareMode('full14')}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${compareMode === 'full14' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
              >
                14j ouvrés complets
              </button>
            </div>

            {/* Résumé chiffres */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{displayBeforeLabel}</p>
                <p className="text-base font-bold text-foreground">{displayBefore}</p>
                <p className="text-[10px] text-muted-foreground">{(displayAvgBefore || 0).toFixed(1)}/j</p>
              </div>
              <div className="bg-primary/8 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">En TG ({daysInTG}j)</p>
                <p className="text-base font-bold text-foreground">{afterTotal}</p>
                <p className="text-[10px] text-muted-foreground">{(avgAfter || 0).toFixed(1)}/j</p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${displayDelta === null ? 'bg-secondary/50' : displayDelta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-[10px] text-muted-foreground">Évolution</p>
                {displayDelta === null ? (
                  <p className="text-base font-bold text-muted-foreground">—</p>
                ) : (
                  <div className="flex items-center justify-center gap-0.5">
                    {displayDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    <p className={`text-base font-bold ${displayDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>{displayDelta >= 0 ? '+' : ''}{displayDelta.toFixed(0)}%</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">moy/j</p>
              </div>
            </div>

            {/* Graphique */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ventes jour par jour (J-21 → J+21)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 8 }}
                    interval={6}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [v, 'ventes']}
                    labelFormatter={(l) => `Jour ${l}`}
                  />
                  <ReferenceLine x="J0" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1.5} />
                  <Bar
                    dataKey="ventes"
                    radius={[2, 2, 0, 0]}
                    fill="#6366f1"
                    fillOpacity={0.7}
                    // Couleur différente avant/après
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[9px] text-center text-muted-foreground mt-0.5">La ligne pointillée marque la date d'entrée en TG</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
