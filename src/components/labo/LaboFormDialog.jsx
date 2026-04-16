import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const currentYear = new Date().getFullYear();
const ANNEES = [currentYear - 1, currentYear, currentYear + 1];

export default function LaboFormDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [form, setForm] = useState({
    laboratoire: "", ca_ht_n: "", ca_ht_n1: "", mois: "", annee: currentYear, updated_at: ""
  });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, ca_ht_n: initialData.ca_ht_n ?? "", ca_ht_n1: initialData.ca_ht_n1 ?? "" });
    } else {
      setForm({ laboratoire: "", ca_ht_n: "", ca_ht_n1: "", mois: "", annee: currentYear, updated_at: new Date().toISOString().split('T')[0] });
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      ca_ht_n: parseFloat(form.ca_ht_n) || 0,
      ca_ht_n1: parseFloat(form.ca_ht_n1) || 0,
      annee: String(form.annee),
      updated_at: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-white/60 p-0 overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1.5px solid rgba(255,255,255,0.8)",
          boxShadow: "0 20px 60px rgba(120,100,255,0.18)"
        }}>
        <div className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-slate-800">
            {initialData ? "Modifier l'entrée" : "Nouvelle entrée"}
          </DialogTitle>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-600 font-medium">Laboratoire</Label>
            <Input placeholder="Nom du laboratoire" value={form.laboratoire}
              onChange={(e) => setForm({ ...form, laboratoire: e.target.value })} required
              className="rounded-xl border-white/60 bg-white/60 backdrop-blur-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-medium">CA HT N (€)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.ca_ht_n}
                onChange={(e) => setForm({ ...form, ca_ht_n: e.target.value })} required
                className="rounded-xl border-white/60 bg-white/60 backdrop-blur-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-medium">CA HT N-1 (€)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.ca_ht_n1}
                onChange={(e) => setForm({ ...form, ca_ht_n1: e.target.value })}
                className="rounded-xl border-white/60 bg-white/60 backdrop-blur-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-medium">Mois</Label>
              <Select value={form.mois} onValueChange={(v) => setForm({ ...form, mois: v })} required>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/60 backdrop-blur-sm">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {MOIS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-medium">Année</Label>
              <Select value={String(form.annee)} onValueChange={(v) => setForm({ ...form, annee: Number(v) })}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/60 backdrop-blur-sm">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {ANNEES.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm text-slate-600 transition-all hover:bg-white/60"
              style={{ background: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.25)" }}>
              Annuler
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
              {initialData ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}