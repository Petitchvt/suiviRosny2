import { useState, useMemo, useRef } from "react";
import { challengeBase44 } from "@/api/moduleClients";
import { useQuery } from "@tanstack/react-query";

import { Trophy, Download } from "lucide-react";
import PodiumCard from "@/components/podium/PodiumCard";
import TeamDetailCard from "@/components/podium/TeamDetailCard";
import PointsLegend from "@/components/dashboard/PointsLegend";
import ClassementOperateurs from "@/components/dashboard/ClassementOperateurs";
import SemainePicker from "@/components/dashboard/SemainePicker";
import { calculerCartes, EQUIPES, MISSIONS, getEquipeOfOperateur, produitMatchDucray } from "@/lib/teamsConfig";
import { normalizeOperateur } from "@/lib/normalizeOperateur";
import { filtrerVentesParSemaine, getSemainesDisponibles, labelSemaine } from "@/lib/semaineUtils";
import { useSemaine } from "@/lib/SemaineContext";

function calculerPointsEquipe(ventes) {
  return ventes.reduce((sum, v) => {
    const pts = { NUTERGIA: 1, SOLGAR: 1.5, DUCRAY: 2 }[v.laboratoire?.toUpperCase()?.trim()] || 0;
    return sum + pts * (v.quantite || 1);
  }, 0);
}

export default function Dashboard() {
  const { semaine, setSemaine } = useSemaine();
  const [exportMode, setExportMode] = useState(false);
  const podiumRef = useRef(null);

  async function exportPDF() {
    setExportMode(true);
    await new Promise(r => setTimeout(r, 100));
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(podiumRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save("podium.pdf");
    setExportMode(false);
  }

  const { data: ventes = [], isLoading } = useQuery({
    queryKey: ["ventes-operateurs"],
    queryFn: () => challengeBase44.entities.VentesOperateurs.list("-created_date", 10000),
  });

  const { data: bonusEquipes = [] } = useQuery({
    queryKey: ["bonus-equipe"],
    queryFn: () => challengeBase44.entities.BonusEquipe.list("-created_date", 500),
  });

  const { data: operateurs = [] } = useQuery({
    queryKey: ["operateurs"],
    queryFn: () => challengeBase44.entities.Operateur.list(),
    refetchInterval: 5000,
  });

  const semaines = useMemo(() => getSemainesDisponibles(ventes), [ventes]);

  const ventesFiltrees = useMemo(() => filtrerVentesParSemaine(ventes, semaine), [ventes, semaine]);

  const derniereMaj = ventes.length > 0
    ? ventes.reduce((latest, v) => {
        const d = new Date(v.updated_at || v.created_date);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;

  // Group ventes by equipe
  const ventesParEquipe = useMemo(() => {
    const map = {};
    for (const equipe of Object.keys(EQUIPES)) map[equipe] = [];
    for (const v of ventesFiltrees) {
      const eq = getEquipeOfOperateur(normalizeOperateur(v.operateur));
      if (eq) map[eq].push(v);
    }
    return map;
  }, [ventesFiltrees]);

  const equipeStats = Object.entries(EQUIPES).map(([nom]) => {
    const ptsVentes = calculerPointsEquipe(ventesParEquipe[nom] || []);

    // Bonus/malus manuels équipe
    const bonusEq = bonusEquipes.filter(b => {
      if (b.equipe !== nom) return false;
      if (semaine === "global") return true;
      return b.semaine === semaine;
    });
    const bonusPts = bonusEq.reduce((sum, b) => sum + (b.points || 0), 0);
    const points = ptsVentes + bonusPts;

    let cartes = 0;
    
    // Si global, compter missions cumulées par semaine avec objectifs cumulés
    if (semaine === "global" && semaines.length > 0) {
      let cartesParMissions = 0;
      for (const mission of MISSIONS) {
        let totalCumulé = 0;
        let objectifCumulé = 0;
        for (const s of semaines) {
          const ventesS = filtrerVentesParSemaine(ventes, s).filter(v =>
            getEquipeOfOperateur(normalizeOperateur(v.operateur)) === nom
          );
          let totalSemaine = 0;
          for (const v of ventesS) {
            if (v.laboratoire?.toUpperCase()?.trim() === mission.laboratoire.toUpperCase() && produitMatchDucray(v.produit, mission)) {
              totalSemaine += v.quantite || 1;
            }
          }
          totalCumulé += totalSemaine;
          objectifCumulé += mission.objectif;
        }
        if (totalCumulé >= objectifCumulé) cartesParMissions++;
      }
      // Cartes par pts : 1 carte par semaine si ≥80 pts de ventes
      let cartesParPts = 0;
      for (const s of semaines) {
        const ventesS = filtrerVentesParSemaine(ventes, s).filter(v =>
          getEquipeOfOperateur(normalizeOperateur(v.operateur)) === nom
        );
        if (calculerPointsEquipe(ventesS) >= 80) cartesParPts++;
      }
      cartes = cartesParMissions + cartesParPts;
    } else {
      // Cartes par missions
      const cartesParMissions = calculerCartes(ventesParEquipe[nom] || [], MISSIONS);
      // Cartes par pts : 1 carte si ≥80 pts de ventes (pas les ajustements)
      const cartesParPts = ptsVentes >= 80 ? 1 : 0;
      cartes = cartesParMissions + cartesParPts;
    }

    return {
      nom,
      points,
      bonusPts,
      cartes,
      ventes: ventesParEquipe[nom] || [],
    };
  }).sort((a, b) => b.points - a.points);

  const podiumOrder = [equipeStats[1], equipeStats[0], equipeStats[2]].filter(Boolean);
  const podiumRanks = { [equipeStats[0]?.nom]: 1, [equipeStats[1]?.nom]: 2, [equipeStats[2]?.nom]: 3 };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none" style={{background: "radial-gradient(circle, #bfdbfe 0%, transparent 70%)"}} />
      <div className="absolute top-[10%] right-[-150px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)"}} />
      <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{background: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)"}} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl glass">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
              Challenge Équipes
            </h1>
          </div>
          <p className="text-slate-500 mt-2 text-base">
            {semaine === "global" ? "Global — 18 mars au 3 mai 2026" : labelSemaine(semaine)}
          </p>
          <div className="mt-4 flex justify-center">
            <PointsLegend />
          </div>
        </div>

        {/* Filtre semaine */}
        <div className="flex justify-center mb-8">
          <SemainePicker semaines={semaines} value={semaine} onChange={setSemaine} />
        </div>

        {/* Export PDF */}
        <div className="flex justify-end mb-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition">
            <Download className="w-4 h-4" /> Exporter PDF
          </button>
        </div>

        {/* Podium */}
        <div ref={podiumRef} className="flex items-end justify-center gap-4 sm:gap-8 mb-10 p-6">
          {podiumOrder.map((eq) => (
            <PodiumCard
              key={eq.nom}
              equipe={eq.nom}
              points={eq.points}
              bonusPts={eq.bonusPts}
              cartes={eq.cartes}
              rank={podiumRanks[eq.nom]}
              isCenter={podiumRanks[eq.nom] === 1}
              showCartes={!exportMode}
            />
          ))}
        </div>

        {/* Team detail cards — même ordre que le podium visuel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {podiumOrder.map((eq) => {
            const orderClass = podiumRanks[eq.nom] === 1 ? "md:order-2" : podiumRanks[eq.nom] === 2 ? "md:order-1" : "md:order-3";
            return (
              <div key={eq.nom} className={orderClass}>
                <TeamDetailCard
                  equipe={eq.nom}
                  ventesEquipe={eq.ventes}
                  points={eq.points}
                  cartes={eq.cartes}
                />
              </div>
            );
          })}
        </div>

        {/* Classement opérateurs */}
        <ClassementOperateurs ventes={ventesFiltrees} operateurs={operateurs} bonusEquipes={bonusEquipes.filter(b => b.operateur_nom && (semaine === "global" || b.semaine === semaine))} />

        {/* Dernière MAJ */}
        {derniereMaj && (
          <p className="text-right text-xs text-slate-400 mt-6">
            Dernière mise à jour : {derniereMaj.toLocaleDateString("fr-FR")} à {derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}
