import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FlaskConical, ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';

import LaboStatsCards from '../components/labo/LaboStatsCards';
import LaboComparisonTable from '../components/labo/LaboComparisonTable';
import LaboChart from '../components/labo/LaboChart';
import LaboFormDialog from '../components/labo/LaboFormDialog';
import LaboDetailModal from '../components/labo/LaboDetailModal';

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function SuiviLaboratoires() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMoisName = MOIS[now.getMonth()];

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMois, setSelectedMois] = useState(currentMoisName);
  const [progression, setProgression] = useState({ totalJours: null });
  const [selectedLabo, setSelectedLabo] = useState(null);
  const [prorataMode, setProrataMode] = useState(true);

  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ventescomparatif'],
    queryFn: () => base44.entities.VentesComparatif.list('-created_date', 10000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VentesComparatif.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ventescomparatif'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VentesComparatif.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ventescomparatif'] }); setShowForm(false); setEditingEntry(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VentesComparatif.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ventescomparatif'] }),
  });

  const handleSubmit = (data) => {
    if (editingEntry) updateMutation.mutate({ id: editingEntry.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (entry) => { setEditingEntry(entry); setShowForm(true); };

  const handleDelete = (entry) => {
    if (window.confirm(`Supprimer cette entrée de ${entry.laboratoire} ?`)) {
      deleteMutation.mutate(entry.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e0eaff 0%, #f0e6ff 40%, #e6f7ff 100%)" }}>
        <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin shadow-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 50%, #f5f7fa 100%)" }}>
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #cbd5e1, transparent)" }} />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #e2e8f0, transparent)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8 rounded-3xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1.5px solid rgba(255,255,255,0.7)",
            boxShadow: "0 8px 32px 0 rgba(120,100,255,0.10), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}>
          <div className="flex items-center gap-4">
              <Link to="/laboratoires" className="p-2 rounded-xl hover:bg-white/60 transition-colors text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-3 rounded-2xl shadow-inner"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(96,165,250,0.4))",
                border: "1px solid rgba(255,255,255,0.8)"
              }}>
              <FlaskConical className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Suivi Laboratoires</h1>
              <p className="text-sm text-slate-500">CA HT — {currentYear} vs {currentYear - 1}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedMois} onValueChange={setSelectedMois}>
              <SelectTrigger className="w-44 rounded-xl border-white/60 bg-white/50 backdrop-blur-md text-slate-700 shadow-sm">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois (cumulé)</SelectItem>
                {MOIS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => { setEditingEntry(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", boxShadow: "0 4px 15px rgba(124,58,237,0.35)" }}>
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Stats + Progression */}
        <div className="mb-8">
          <LaboStatsCards entries={entries} currentYear={currentYear} selectedMois={selectedMois} progression={progression} onProgressionChange={setProgression} />
        </div>

        {/* Tabs */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.65)",
            boxShadow: "0 8px 32px 0 rgba(120,100,255,0.08), inset 0 1px 0 rgba(255,255,255,0.7)"
          }}>
          <Tabs defaultValue="comparison">
            <div className="px-4 pt-4">
              <TabsList className="rounded-2xl p-1 w-full sm:w-auto"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  backdropFilter: "blur(10px)"
                }}>
                <TabsTrigger value="comparison" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-violet-700 text-slate-600 font-medium">Comparaison</TabsTrigger>
                <TabsTrigger value="chart" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-violet-700 text-slate-600 font-medium">Graphique</TabsTrigger>
              </TabsList>
            </div>
            <div className="p-4">
              <TabsContent value="comparison" className="mt-0">
                <LaboComparisonTable entries={entries} selectedMois={selectedMois} currentYear={currentYear} onEdit={handleEdit} onDelete={handleDelete} progression={progression} onLaboClick={setSelectedLabo} prorataMode={prorataMode} onProrataChange={setProrataMode} />
              </TabsContent>
              <TabsContent value="chart" className="mt-0">
                <LaboChart entries={entries} selectedMois={selectedMois} currentYear={currentYear} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer dernière MAJ */}
      {entries.length > 0 && (() => {
        const lastUpdated = entries.reduce((latest, e) => {
          const d = new Date(e.updated_date || e.created_date);
          return d > latest ? d : latest;
        }, new Date(0));
        return (
          <div className="mt-6 text-center text-xs text-slate-400">
            Dernière mise à jour : {lastUpdated.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        );
      })()}

      <LaboFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingEntry(null); }}
        onSubmit={handleSubmit}
        initialData={editingEntry}
      />

      {selectedLabo && (
        <LaboDetailModal
          labo={selectedLabo}
          entries={entries}
          currentYear={currentYear}
          onClose={() => setSelectedLabo(null)}
          allLabos={[...new Set(entries.map(e => e.laboratoire))].sort()}
          onNavigate={setSelectedLabo}
          prorataMode={true}
        />
      )}
    </div>
  );
}
