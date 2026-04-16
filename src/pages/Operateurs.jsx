import { useState, useMemo } from "react";
import { challengeBase44 } from "@/api/moduleClients";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Filter } from "lucide-react";
import SemainePicker from "@/components/dashboard/SemainePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSemaineKey, getSemainesDisponibles, labelSemaine } from "@/lib/semaineUtils";
import { useSemaine } from "@/lib/SemaineContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { grouperParOperateur } from "@/lib/pointsConfig";
import { EQUIPES, TEAM_COLORS, getEquipeOfOperateur } from "@/lib/teamsConfig";
import { normalizeOperateur } from "@/lib/normalizeOperateur";

const PTS_LABO = { NUTERGIA: 1, SOLGAR: 1.5, DUCRAY: 2 };

function calcPtsFromVentes(ventes) {
  return ventes.reduce((sum, v) => {
    const pts = PTS_LABO[v.laboratoire?.toUpperCase()?.trim()] || 0;
    return sum + pts * (v.quantite || 1);
  }, 0);
}

export default function Operateurs() {
  const qc = useQueryClient();
  const [sort, setSort] = useState({ field: "points", dir: "desc" });
  const [filtreEquipe, setFiltreEquipe] = useState("tout");
  const [showAdd, setShowAdd] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newEquipe, setNewEquipe] = useState("Équipe 1");
  const [expanded, setExpanded] = useState({});
  const { semaine: periode, setSemaine: setPeriode } = useSemaine();

  const { data: ventes = [] } = useQuery({
    queryKey: ["ventes-operateurs"],
    queryFn: () => challengeBase44.entities.VentesOperateurs.list("-created_date", 10000),
  });

  const { data: operateurs = [] } = useQuery({
    queryKey: ["operateurs"],
    queryFn: () => challengeBase44.entities.Operateur.list(),
  });

  const { data: bonusEquipes = [] } = useQuery({
    queryKey: ["bonus-equipe"],
    queryFn: () => challengeBase44.entities.BonusEquipe.list("-created_date", 500),
  });

  const createOp = useMutation({
    mutationFn: (data) => challengeBase44.entities.Operateur.create(data),
    onSuccess: () => { qc.invalidateQueries(["operateurs"]); setShowAdd(false); setNewNom(""); },
  });

  const deleteOp = useMutation({
    mutationFn: (id) => challengeBase44.entities.Operateur.delete(id),
    onSuccess: () => qc.invalidateQueries(["operateurs"]),
  });

  const updateBonus = useMutation({
    mutationFn: ({ id, bonus }) => challengeBase44.entities.Operateur.update(id, { points_bonus: bonus }),
    onSuccess: () => { qc.invalidateQueries(["operateurs"]); },
  });

  // Filter ventes by period using getSemaineKey (same logic as dashboard)
  const ventesFiltrees = useMemo(() => {
    if (periode === "global") return ventes;
    return ventes.filter(v => getSemaineKey(v) === periode);
  }, [ventes, periode]);

  // Build all operator names: from DB + from teamsConfig
  const allNomsDefined = Object.values(EQUIPES).flatMap(e => e.membres);
  const nomsDB = operateurs.map(o => o.nom?.trim());
  const allNoms = [...new Set([...allNomsDefined, ...nomsDB])];

  const ventesParOp = grouperParOperateur(ventesFiltrees, normalizeOperateur);

  const bonusEquipesFiltres = periode === "global"
    ? bonusEquipes.filter(b => b.operateur_nom)
    : bonusEquipes.filter(b => b.operateur_nom && b.semaine === periode);

  const rows = allNoms.map((nom) => {
    const dbRecord = operateurs.find(o => o.nom?.trim() === nom);
    const equipe = getEquipeOfOperateur(nom) || dbRecord?.equipe || "?";
    const ventesOp = ventesParOp[nom] || [];
    const ptsVentes = calcPtsFromVentes(ventesOp);
    const bonus = bonusEquipesFiltres
      .filter(b => b.operateur_nom === nom)
      .reduce((sum, b) => sum + (b.points || 0), 0);
    const totalPts = ptsVentes + bonus;
    const isChef = Object.values(EQUIPES).some(e => e.chefs.includes(nom));
    const totalBoites = ventesOp.reduce((s, v) => s + (v.quantite || 1), 0);
    return { nom, equipe, ptsVentes, bonus, totalPts, isChef, totalBoites, dbRecord };
  });

  const filteredRows = filtreEquipe === "tout" ? rows : rows.filter(r => r.equipe === filtreEquipe);
  const sorted = [...filteredRows].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.field === "nom") return dir * a.nom.localeCompare(b.nom);
    if (sort.field === "points") return dir * (a.totalPts - b.totalPts);
    return 0;
  });

  function toggleSort(field) {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" });
  }

  function SortIcon({ field }) {
    if (sort.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return sort.dir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)"}} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{background: "radial-gradient(circle, #bfdbfe 0%, transparent 70%)"}} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Classement Opérateurs</h1>
            <p className="text-slate-500 text-sm mt-1">{rows.length} opérateurs</p>
          </div>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filtreEquipe} onValueChange={setFiltreEquipe}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tout">Toutes les équipes</SelectItem>
              {Object.keys(EQUIPES).map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre période */}
        <div className="flex items-center gap-3 mb-4">
          <SemainePicker semaines={getSemainesDisponibles(ventes)} value={periode} onChange={setPeriode} />
        </div>

        {/* Table header */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide" style={{background:"rgba(0,0,0,0.03)"}}>
            <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("nom")}>
              Opérateur <SortIcon field="nom" />
            </button>
            <span>Équipe</span>
            <span>Boîtes</span>
            <button className="flex items-center gap-1" onClick={() => toggleSort("points")}>
              Points <SortIcon field="points" />
            </button>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-white/10">
            {sorted.map((row) => {
              const equipeConfig = EQUIPES[row.equipe];
              const colors = TEAM_COLORS[equipeConfig?.color || "emerald"];
              const isExpanded = expanded[row.nom];

              return (
                <div key={row.nom}>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-black/[0.02] transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => setExpanded(e => ({ ...e, [row.nom]: !e[row.nom] }))} className="text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <span className="font-medium text-slate-800 truncate">{row.nom}</span>
                      {row.isChef && <Star className={`w-3.5 h-3.5 fill-current flex-shrink-0 ${colors.text}`} />}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{row.equipe}</span>
                    <span className="text-sm text-center text-slate-400">{row.totalBoites}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-800 min-w-[36px] text-center">
                        {row.totalPts.toFixed(1)}
                      </span>
                      {row.bonus !== 0 && <span className={`text-xs ${row.bonus > 0 ? "text-emerald-600" : "text-red-500"}`}>({row.bonus > 0 ? "+" : ""}{row.bonus})</span>}
                    </div>
                    <button
                      onClick={() => row.dbRecord && deleteOp.mutate(row.dbRecord.id)}
                      disabled={!row.dbRecord}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-12 pb-4 bg-black/[0.02]">
                      {ventesParOp[row.nom]?.length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(
                            ventesParOp[row.nom].reduce((acc, v) => {
                              const k = `${v.laboratoire} · ${v.produit}`;
                              acc[k] = (acc[k] || 0) + (v.quantite || 1);
                              return acc;
                            }, {})
                          ).sort((a, b) => b[1] - a[1]).map(([label, qty]) => (
                            <div key={label} className="flex justify-between text-sm py-1 px-3 rounded-lg hover:bg-black/[0.03]">
                                <span className="text-slate-500">{label}</span>
                                <span className="font-medium text-slate-700">{qty}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Aucune vente enregistrée</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un opérateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="Nom de l'opérateur" value={newNom} onChange={e => setNewNom(e.target.value)} />
              <Select value={newEquipe} onValueChange={setNewEquipe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(EQUIPES).map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={() => createOp.mutate({ nom: newNom.trim(), equipe: newEquipe, points_bonus: 0 })} disabled={!newNom.trim()}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
