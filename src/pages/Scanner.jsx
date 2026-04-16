import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import PharmacyMap, { ALL_TGS } from '@/components/scanner/PharmacyMap';
import ScanSession from '@/components/scanner/ScanSession';

const TG = base44.entities.TG;
const ProduitTG = base44.entities.ProduitTG;

export default function Scanner() {
  const [tgData, setTgData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTG, setSelectedTG] = useState(null); // { id, nom }

  const loadData = async () => {
    const [products, tgs] = await Promise.all([
      ProduitTG.filter({ actif: true }),
      TG.filter({ actif: true }),
    ]);

    const tgNameMap = {};
    tgs.forEach(t => { tgNameMap[t.id] = t.nom; });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const data = {};
    products.forEach(p => {
      const nom = tgNameMap[p.tg_id];
      if (!nom) return;
      if (!data[nom]) data[nom] = { count: 0, hasNew: false };
      data[nom].count++;
      if (new Date(p.date_entree) >= weekStart) data[nom].hasNew = true;
    });

    setTgData(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (selectedTG) {
    return (
      <ScanSession
        tg={selectedTG}
        onBack={() => { setSelectedTG(null); loadData(); }}
      />
    );
  }

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
        <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Plan Pharmacie</h2>
        <p className="text-sm text-muted-foreground italic">Touchez une TG pour scanner ses produits</p>
      </div>
      <PharmacyMap tgData={tgData} onSelect={(tgName) => {
        // on cherche ou crée la TG par nom
        setSelectedTG({ nom: tgName });
      }} />
    </div>
  );
}