import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, ChevronUp, Pencil, Check, X, ChevronDown, Map } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import ConfigPharmacyMap from '@/components/config/ConfigPharmacyMap';

const TGEntity = base44.entities.TG;

export default function ConfigTG() {
  const [tgList, setTgList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({ nom: '', laboratoire: '', emplacement: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadTGs = async () => {
    const tgs = await TGEntity.list();
    // Tri par ordre ou nom
    setTgList(tgs.sort((a, b) => {
      if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
      return a.nom.localeCompare(b.nom);
    }));
    setLoading(false);
  };

  useEffect(() => { loadTGs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return;
    setSaving(true);
    await TGEntity.create({ nom: form.nom.trim(), laboratoire: form.laboratoire, emplacement: form.emplacement, actif: true });
    toast.success(`TG "${form.nom}" créée`);
    setForm({ nom: '', laboratoire: '', emplacement: '' });
    setShowForm(false);
    await loadTGs();
    setSaving(false);
  };

  const handleDelete = async (tg) => {
    setDeletingId(tg.id);
    await TGEntity.update(tg.id, { actif: false });
    toast.success(`TG "${tg.nom}" désactivée`);
    await loadTGs();
    setDeletingId(null);
  };

  const startEdit = (tg) => {
    setEditingId(tg.id);
    setEditForm({ nom: tg.nom, laboratoire: tg.laboratoire || '', emplacement: tg.emplacement || '' });
  };

  const handleSaveEdit = async (tg) => {
    if (!editForm.nom.trim()) return;
    await TGEntity.update(tg.id, { nom: editForm.nom.trim(), laboratoire: editForm.laboratoire, emplacement: editForm.emplacement });
    toast.success('TG mise à jour');
    setEditingId(null);
    await loadTGs();
  };

  const moveUp = async (idx) => {
    const activeTGs = tgList.filter(t => t.actif);
    if (idx === 0) return;
    const newList = [...activeTGs];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    // Enregistrer les ordres
    await Promise.all(newList.map((t, i) => TGEntity.update(t.id, { ordre: i })));
    await loadTGs();
  };

  const moveDown = async (idx) => {
    const activeTGs = tgList.filter(t => t.actif);
    if (idx === activeTGs.length - 1) return;
    const newList = [...activeTGs];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    await Promise.all(newList.map((t, i) => TGEntity.update(t.id, { ordre: i })));
    await loadTGs();
  };

  const handleMapMove = async (tg, newRow, newCol, oldRow, oldCol) => {
    // Trouver si une TG occupe déjà la case cible (swap)
    const COLS = 2;
    const activeTGs = tgList.filter(t => t.actif);
    // Reconstruire la grille actuelle
    const hasPosData = activeTGs.some(t => t.map_row !== undefined && t.map_row !== null);
    let gridMap = {};
    if (hasPosData) {
      activeTGs.forEach(t => {
        if (t.map_row !== undefined) gridMap[`${t.map_row}-${t.map_col}`] = t;
      });
    } else {
      activeTGs.forEach((t, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        gridMap[`${r}-${c}`] = t;
      });
    }
    const occupant = gridMap[`${newRow}-${newCol}`];
    const updates = [TGEntity.update(tg.id, { map_row: newRow, map_col: newCol })];
    if (occupant) {
      updates.push(TGEntity.update(occupant.id, { map_row: oldRow, map_col: oldCol }));
    }
    await Promise.all(updates);
    await loadTGs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeTGs = tgList.filter(t => t.actif);
  const inactiveTGs = tgList.filter(t => !t.actif);

  return (
    <div className="space-y-5 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Config TG</h2>
          <p className="text-sm text-muted-foreground italic">{activeTGs.length} TG(s) actives</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-all ${showMap ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <Map className="w-4 h-4" />
            Plan
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-sm active:scale-95 transition-all"
          >
            {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Fermer' : 'Nouvelle TG'}
          </button>
        </div>
      </div>

      {/* Plan interactif */}
      {showMap && (
        <ConfigPharmacyMap
          tgList={activeTGs}
          onMove={handleMapMove}
        />
      )}

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nouvelle tête de gondole</p>
          <Input placeholder="Nom de la TG *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
          <Input placeholder="Laboratoire (optionnel)" value={form.laboratoire} onChange={e => setForm(f => ({ ...f, laboratoire: e.target.value }))} />
          <Input placeholder="Emplacement (optionnel)" value={form.emplacement} onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))} />
          <button
            type="submit"
            disabled={saving || !form.nom.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer la TG
          </button>
        </form>
      )}

      {/* Liste TGs actives */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Actives ({activeTGs.length})</p>
        {activeTGs.length === 0 && (
          <p className="text-center py-6 text-muted-foreground text-sm">Aucune TG active</p>
        )}
        {activeTGs.map((tg, idx) => (
          <div key={tg.id} className="bg-white border border-border rounded-xl p-3 shadow-sm">
            {editingId === tg.id ? (
              <div className="space-y-2">
                <Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom *" />
                <Input value={editForm.laboratoire} onChange={e => setEditForm(f => ({ ...f, laboratoire: e.target.value }))} placeholder="Laboratoire" />
                <Input value={editForm.emplacement} onChange={e => setEditForm(f => ({ ...f, emplacement: e.target.value }))} placeholder="Emplacement" />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(tg)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Enregistrer
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold">
                    <X className="w-3.5 h-3.5" /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                {/* Boutons déplacement */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-20 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === activeTGs.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-20 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm">{tg.nom}</p>
                  <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                    {tg.laboratoire && <span>🏭 {tg.laboratoire}</span>}
                    {tg.emplacement && <span>📍 {tg.emplacement}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(tg)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tg)}
                    disabled={deletingId === tg.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    {deletingId === tg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Liste TGs inactives */}
      {inactiveTGs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Inactives ({inactiveTGs.length})</p>
          {inactiveTGs.map(tg => (
            <div key={tg.id} className="bg-secondary/50 border border-border rounded-xl p-3 flex items-start justify-between gap-3 opacity-60">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm line-through">{tg.nom}</p>
                <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                  {tg.laboratoire && <span>{tg.laboratoire}</span>}
                  {tg.emplacement && <span>{tg.emplacement}</span>}
                </div>
              </div>
              <button
                onClick={async () => {
                  await TGEntity.update(tg.id, { actif: true });
                  toast.success(`TG "${tg.nom}" réactivée`);
                  loadTGs();
                }}
                className="text-[11px] text-primary font-medium px-2 py-1 rounded-lg bg-primary/10 shrink-0"
              >
                Réactiver
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}