import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, X, Check, Loader2, Sparkles, Camera, ScanLine, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CameraScanner from './CameraScanner';

const TGEntity = base44.entities.TG;
const ProduitTGEntity = base44.entities.ProduitTG;
const ScanSessionEntity = base44.entities.ScanSession;
const StatsProduitEntity = base44.entities.StatsProduit;

const AZERTY_TO_DIGIT = {
  'à':'0','&':'1','é':'2','"':'3',"'":'4',
  '(':'5','§':'6','è':'7','!':'8','ç':'9',
  'À':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9','0':'0'
};
const translateToDigits = (str) => str.split('').map(c => AZERTY_TO_DIGIT[c] ?? '').join('');

export default function ScanSession({ tg, onBack }) {
  const [tgObj, setTgObj] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [previousEans, setPreviousEans] = useState(new Set());
  const [statsMap, setStatsMap] = useState({});
  const [validating, setValidating] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [loadingTG, setLoadingTG] = useState(true);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const focusIntervalRef = useRef(null);

  useEffect(() => {
    async function init() {
      // Chercher ou créer la TG par son nom
      let existing = await TGEntity.filter({ nom: tg.nom, actif: true });
      let tgRecord;
      if (existing.length > 0) {
        tgRecord = existing[0];
      } else {
        tgRecord = await TGEntity.create({ nom: tg.nom, actif: true });
      }
      setTgObj(tgRecord);

      const products = await ProduitTGEntity.filter({ tg_id: tgRecord.id, actif: true });
      setPreviousEans(new Set(products.map(p => p.ean)));

      // Charger les stats
      const stats = await StatsProduitEntity.list();
      const map = {};
      stats.forEach(s => { map[s.ean] = s; });
      setStatsMap(map);

      setLoadingTG(false);
    }
    init();
  }, [tg.nom]);

  // Maintenir le focus sur l'input
  useEffect(() => {
    if (!useCamera) {
      focusIntervalRef.current = setInterval(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
    return () => clearInterval(focusIntervalRef.current);
  }, [useCamera, loadingTG]);

  const processEAN = useCallback((ean) => {
    const digits = translateToDigits(ean).replace(/[^0-9]/g, '').slice(0, 13);
    if (digits.length < 8) return;
    setScannedItems(prev => {
      if (prev.some(item => item.ean === digits)) {
        toast('EAN déjà scanné', { icon: '⚠️' });
        return prev;
      }
      const isNew = !previousEans.has(digits);
      const stats = statsMap[digits] || {};
      return [...prev, {
        ean: digits,
        isNew,
        libelle: stats.libelle || digits,
        stock: stats.stock_actuel,
        ventes_jour: stats.ventes_jour,
        ventes_total: stats.ventes_total,
        ca_ht: stats.ca_ht,
      }];
    });
  }, [previousEans, statsMap]);

  const handleScanInput = useCallback((value) => {
    const translated = translateToDigits(value);
    setScanValue(translated);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (translated.length >= 8) {
        processEAN(translated);
        setScanValue('');
      }
    }, 100);
  }, [processEAN]);

  const handleManualSubmit = () => {
    if (scanValue.length >= 8) {
      processEAN(scanValue);
      setScanValue('');
    }
  };

  const removeItem = (ean) => setScannedItems(prev => prev.filter(item => item.ean !== ean));

  const validateSession = async () => {
    if (!tgObj || scannedItems.length === 0) return;
    setValidating(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();
    const weekNum = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);

    await ScanSessionEntity.create({ tg_id: tgObj.id, date_scan: today, semaine: weekNum });

    const scannedEans = new Set(scannedItems.map(i => i.ean));
    const activeProducts = await ProduitTGEntity.filter({ tg_id: tgObj.id, actif: true });

    // Désactiver les produits non rescannés
    for (const prod of activeProducts) {
      if (!scannedEans.has(prod.ean)) {
        await ProduitTGEntity.update(prod.id, { actif: false, date_sortie: today });
      }
    }

    // Insérer les nouveaux produits + mettre à jour le libellé des existants
    const existingEans = new Set(activeProducts.map(p => p.ean));
    const existingByEan = {};
    activeProducts.forEach(p => { existingByEan[p.ean] = p; });

    for (const item of scannedItems) {
      const libelle = item.libelle && item.libelle !== item.ean ? item.libelle : '';
      if (!existingEans.has(item.ean)) {
        await ProduitTGEntity.create({
          tg_id: tgObj.id,
          ean: item.ean,
          libelle,
          date_entree: today,
          actif: true,
        });
      } else if (libelle && !existingByEan[item.ean]?.libelle) {
        // Mettre à jour le libellé si on en a un et qu'il était vide
        await ProduitTGEntity.update(existingByEan[item.ean].id, { libelle });
      }
    }

    setValidating(false);
    toast.success(`Session validée : ${scannedItems.length} produits`);
    onBack();
  };

  if (loadingTG) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground text-base">{tg.nom}</h2>
          <p className="text-xs text-muted-foreground">{scannedItems.length} produit(s) scanné(s)</p>
        </div>
        <div className="flex items-center bg-secondary rounded-full p-0.5 border border-border">
          <button
            onClick={() => setUseCamera(false)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!useCamera ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Douchette
          </button>
          <button
            onClick={() => setUseCamera(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useCamera ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            <Camera className="w-3.5 h-3.5" />
            Caméra
          </button>
        </div>
      </div>

      {/* Zone de scan */}
      {useCamera ? (
        <CameraScanner onScan={processEAN} />
      ) : (
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saisie code-barres</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={scanValue}
                onChange={e => handleScanInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleManualSubmit(); }}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0000000000000"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              {scanValue.length > 0 && (
                <button onClick={() => setScanValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={scanValue.length < 8}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white disabled:opacity-30 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] text-muted-foreground">Pointez la douchette ou saisissez manuellement</p>
          </div>
        </div>
      )}

      {/* Liste produits scannés */}
      {scannedItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Produits ({scannedItems.length})
          </p>
          {scannedItems.map((item, idx) => (
            <div
              key={item.ean}
              className={`rounded-2xl px-4 py-3 border transition-all ${item.isNew ? 'bg-green-50 border-green-200' : 'bg-white border-border'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.libelle}</p>
                  <p className="text-xs font-mono text-muted-foreground">{item.ean}</p>
                  {(item.stock !== undefined || item.ventes_jour !== undefined) && (
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {item.stock !== undefined && <span>Stock: <strong>{item.stock}</strong></span>}
                      {item.ventes_jour !== undefined && <span>J: <strong>{item.ventes_jour}</strong></span>}
                      {item.ventes_total !== undefined && <span>Total: <strong>{item.ventes_total}</strong></span>}
                      {item.ca_ht !== undefined && <span>CA: <strong>{Number(item.ca_ht).toFixed(2)}€</strong></span>}
                    </div>
                  )}
                </div>
                {item.isNew && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0 shrink-0">
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    NOUVEAU
                  </Badge>
                )}
                <button onClick={() => removeItem(item.ean)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !useCamera && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ScanLine className="w-7 h-7 text-primary opacity-60" />
            </div>
            <p className="text-muted-foreground text-sm">Aucun produit scanné</p>
            <p className="text-muted-foreground text-xs mt-1">Scannez un code-barres pour commencer</p>
          </div>
        )
      )}

      {/* Bouton valider */}
      {scannedItems.length > 0 && (
        <button
          onClick={validateSession}
          disabled={validating}
          className="w-full h-13 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 py-3.5 shadow-md"
          style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%) 0%, hsl(243,80%,45%) 100%)' }}
        >
          {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Valider la session ({scannedItems.length})
        </button>
      )}
    </div>
  );
}