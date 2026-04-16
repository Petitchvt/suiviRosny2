import React from 'react';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function LaboEntriesList({ entries, onEdit, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        Aucune entrée pour le moment. Cliquez sur "Ajouter" pour commencer.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.4)",
        border: "1px solid rgba(255,255,255,0.7)",
        backdropFilter: "blur(10px)"
      }}>
      <div className="px-5 py-4 border-b border-white/50">
        <h3 className="font-semibold text-slate-700">Toutes les entrées</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.5)" }}>
              {["Laboratoire", "Mois", "CA HT", "Année", "Mis à jour", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}
                className="transition-colors hover:bg-white/30"
                style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                <td className="px-4 py-3 font-medium text-slate-700">{entry.laboratoire}</td>
                <td className="px-4 py-3 text-slate-600">{entry.mois}</td>
                <td className="px-4 py-3 font-mono text-sm text-slate-800">
                  {(entry.ca_ht_n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {new Date(entry.created_date).getFullYear()}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {entry.updated_at || format(new Date(entry.created_date), 'dd/MM/yyyy', { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/60 text-slate-400 hover:text-violet-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(entry)}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/60 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}