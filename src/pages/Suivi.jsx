import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { subtractBusinessDays } from '@/lib/businessDays';
import PharmacyMap from '@/components/scanner/PharmacyMap';
import SuiviTGPopup from '@/components/suivi/SuiviTGPopup';

const TGEntity = base44.entities.TG;
const ProduitTGEntity = base44.entities.ProduitTG;
const VentesTGEntity = base44.entities.VentesTG;
const StatsProduitEntity = base44.entities.StatsProduit;

export default function Suivi() {
  const [loading, setLoading] = useState(true);
  const [tgMapData, setTgMapData] = useState({});   // { [nomTG]: { color, ca, produits } }
  const [tgById, setTgById] = useState({});          // { [id]: tg }
  const [allProduits, setAllProduits] = useState([]); // produits enrichis (avec statut, delta, ca...)
  const [statsMap, setStatsMap] = useState({});
  const [selectedTGName, setSelectedTGName] = useState(null);
  const [selectedTGId, setSelectedTGId] = useState(null);

  useEffect(() => {
    async function load() {
      const [tgs, prods, allVentes, stats] = await Promise.all([
        TGEntity.filter({ actif: true }),
        ProduitTGEntity.filter({ actif: true }),
        VentesTGEntity.list('-date_vente', 10000),
        StatsProduitEntity.list(),
      ]);

      const smap = {};
      stats.forEach(s => { smap[s.ean] = s; });
      setStatsMap(smap);

      const tgByIdMap = {};
      tgs.forEach(t => { tgByIdMap[t.id] = t; });
      setTgById(tgByIdMap);

      const today = new Date();

      // Construire map des dates d'entrée par (ean+tg_id)
      const dateEntreeMap = {};
      prods.forEach(p => {
        dateEntreeMap[`${p.ean}-${p.tg_id}`] = p.date_entree || p.created_date?.split('T')[0];
      });

      // Agréger ventes par (ean+tg_id) par jour relatif
      const ventesParJour = {};
      allVentes.forEach(v => {
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

      // Lissage des pics (même algo que Statistiques)
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
              lissed[d] = { quantite: neighborAvg > 0 ? Math.round(neighborAvg) : 0, ca_ht: neighborAvg > 0 ? (v.ca_ht * neighborAvg / qty) : 0 };
            }
          });
        }
        ventesLissees[key] = lissed;
      });

      // Enrichir chaque produit avec statut et delta
      const produitsEnrichis = prods.map(p => {
        const key = `${p.ean}-${p.tg_id}`;
        const byDay = ventesLissees[key] || {};
        const dateEntreeStr = p.date_entree || p.created_date?.split('T')[0];
        const days = dateEntreeStr ? Math.max(1, differenceInDays(today, parseISO(dateEntreeStr))) : 1;

        let ventesTotales = 0, caTotale = 0;
        Object.entries(byDay).forEach(([dStr, v]) => {
          if (parseInt(dStr) >= 0) { ventesTotales += v.quantite; caTotale += v.ca_ht; }
        });

        // 14j ouvrés avant
        const dateEntreeParsed = dateEntreeStr ? parseISO(dateEntreeStr) : null;
        let ventesBefore14j = 0;
        if (dateEntreeParsed) {
          const start14j = subtractBusinessDays(dateEntreeParsed, 14);
          Object.entries(byDay).forEach(([dStr, v]) => {
            const d = parseInt(dStr);
            if (d < 0) {
              const actualDate = new Date(dateEntreeParsed.getTime() + d * 86400000);
              if (actualDate >= start14j && actualDate.getDay() !== 0) ventesBefore14j += v.quantite;
            }
          });
        }

        const deltaVentes = ventesBefore14j > 0 ? ((ventesTotales - ventesBefore14j) / ventesBefore14j * 100) : null;

        let statut = null;
        if (deltaVentes !== null) {
          if (deltaVentes >= 20) statut = 'TOP';
          else if (deltaVentes >= 5) statut = 'MIDDLE';
          else statut = 'FLOP';
        }

        return {
          ...p,
          libelle: smap[p.ean]?.libelle || p.libelle || p.ean,
          days,
          ventesTotales,
          caTotale,
          ventesBefore14j,
          deltaVentes,
          statut,
        };
      });

      setAllProduits(produitsEnrichis);

      // Construire tgMapData : couleur par TG selon % TOP/FLOP + CA total
      const mapData = {};
      tgs.forEach(t => {
        const tgProds = produitsEnrichis.filter(p => p.tg_id === t.id);
        const total = tgProds.length;
        const nbTop = tgProds.filter(p => p.statut === 'TOP').length;
        const nbFlop = tgProds.filter(p => p.statut === 'FLOP').length;
        const caTotal = tgProds.reduce((s, p) => s + p.caTotale, 0);

        let color = 'gray';
        if (total > 0) {
          if (nbTop / total >= 0.6) color = 'green';
          else if (nbFlop / total >= 0.6) color = 'red';
        }

        mapData[t.nom] = { color, ca: caTotal, count: total };
      });

      setTgMapData(mapData);
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectTG = (tgName) => {
    setSelectedTGName(tgName);
    const tg = Object.values(tgById).find(t => t.nom === tgName);
    setSelectedTGId(tg?.id || null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const selectedTGProduits = selectedTGId ? allProduits.filter(p => p.tg_id === selectedTGId) : [];

  return (
    <div className="space-y-4 pt-4 pb-8">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Suivi</h2>
        <p className="text-sm text-muted-foreground italic">Performance des têtes de gondole</p>
      </div>

      <PharmacyMap tgData={tgMapData} onSelect={handleSelectTG} />

      {selectedTGName && selectedTGId && (
        <SuiviTGPopup
          tgName={selectedTGName}
          tgCa={tgMapData[selectedTGName]?.ca || 0}
          produits={selectedTGProduits}
          allProduits={allProduits}
          onClose={() => { setSelectedTGName(null); setSelectedTGId(null); }}
        />
      )}
    </div>
  );
}