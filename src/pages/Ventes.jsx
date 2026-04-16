import { useState, useMemo } from "react";
import { challengeBase44 } from "@/api/moduleClients";
import { useQuery } from "@tanstack/react-query";
import { getEquipeOfOperateur, EQUIPES, TEAM_COLORS } from "@/lib/teamsConfig";
import { normalizeOperateur } from "@/lib/normalizeOperateur";
import { filtrerVentesParSemaine, getSemainesDisponibles, labelSemaine } from "@/lib/semaineUtils";
import { useSemaine } from "@/lib/SemaineContext";
import SemainePicker from "@/components/dashboard/SemainePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function Ventes() {
  const [filtreEquipe, setFiltreEquipe] = useState("tout");
  const { semaine, setSemaine } = useSemaine();
  const [sort, setSort] = useState({ field: "produit", dir: "asc" });

  const { data: ventes = [], isLoading } = useQuery({
    queryKey: ["ventes-operateurs"],
    queryFn: () => challengeBase44.entities.VentesOperateurs.list("-created_date", 10000),
  });

  const semaines = useMemo(() => getSemainesDisponibles(ventes), [ventes]);

  const lignes = useMemo(() => {
    const ventesFiltrees = filtrerVentesParSemaine(ventes, semaine);
    const mapped = ventesFiltrees.map((v) => {
      const operateur = normalizeOperateur(v.operateur);
      const equipe = getEquipeOfOperateur(operateur) || "?";
      return { produit: v.produit, laboratoire: v.laboratoire, operateur, equipe, quantite: v.quantite || 1 };
    }).filter((l) => filtreEquipe === "tout" || l.equipe === filtreEquipe);

    return [...mapped].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "produit") return dir * (a.produit || "").localeCompare(b.produit || "");
      if (sort.field === "operateur") return dir * (a.operateur || "").localeCompare(b.operateur || "");
      if (sort.field === "equipe") return dir * (a.equipe || "").localeCompare(b.equipe || "");
      if (sort.field === "quantite") return dir * (a.quantite - b.quantite);
      return 0;
    });
  }, [ventes, semaine, filtreEquipe, sort]);

  function toggleSort(field) {
    setSort(s => s.field === field
      ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
      : { field, dir: "asc" }
    );
  }

  function SortIcon({ field }) {
    if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1" />;
    return sort.dir === "asc"
      ? <ArrowUp className="w-3 h-3 text-primary inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-primary inline ml-1" />;
  }

  const equipes = Object.keys(EQUIPES);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)" }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Détail des Ventes</h1>
            <p className="text-slate-500 text-sm mt-1">{lignes.length} ligne{lignes.length > 1 ? "s" : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SemainePicker semaines={semaines} value={semaine} onChange={setSemaine} />
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filtreEquipe} onValueChange={setFiltreEquipe}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Toutes les équipes</SelectItem>
                {equipes.map((eq) => (
                  <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {/* Header with sort */}
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide" style={{ background: "rgba(0,0,0,0.03)" }}>
            <button className="flex items-center gap-1 text-left hover:text-slate-600 transition-colors" onClick={() => toggleSort("produit")}>
              Produit <SortIcon field="produit" />
            </button>
            <button className="flex items-center gap-1 text-left hover:text-slate-600 transition-colors" onClick={() => toggleSort("operateur")}>
              Opérateur <SortIcon field="operateur" />
            </button>
            <button className="flex items-center gap-1 text-left hover:text-slate-600 transition-colors" onClick={() => toggleSort("equipe")}>
              Équipe <SortIcon field="equipe" />
            </button>
            <button className="flex items-center gap-1 text-right hover:text-slate-600 transition-colors" onClick={() => toggleSort("quantite")}>
              Qté <SortIcon field="quantite" />
            </button>
          </div>

          <div className="divide-y divide-black/[0.04]">
            {lignes.length === 0 ? (
              <p className="text-sm text-slate-400 italic px-5 py-6">Aucune vente enregistrée.</p>
            ) : (
              lignes.map((l, i) => {
                const config = EQUIPES[l.equipe];
                const colors = TEAM_COLORS[config?.color || "emerald"];
                return (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 items-center hover:bg-black/[0.02] transition-colors">
                    <div>
                      <span className="text-sm font-medium text-slate-800">{l.produit}</span>
                      {l.laboratoire && (
                        <span className="ml-2 text-xs text-slate-400">{l.laboratoire}</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-600">{l.operateur}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colors.badge}`}>{l.equipe}</span>
                    <span className="text-sm font-semibold text-slate-700 text-right">{l.quantite}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
