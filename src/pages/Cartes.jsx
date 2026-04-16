import { useState, useMemo, useEffect, useRef } from "react";
import { challengeBase44 } from "@/api/moduleClients";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EQUIPES, TEAM_COLORS, MISSIONS, getEquipeOfOperateur, produitMatchDucray } from "@/lib/teamsConfig";
import { normalizeOperateur } from "@/lib/normalizeOperateur";
import { filtrerVentesParSemaine, getSemainesDisponibles, getSemaineKey, labelSemaine } from "@/lib/semaineUtils";
import { useSemaine } from "@/lib/SemaineContext";
import { CARTES_BONUS, CARTES_MALUS, CARTES_STRATEGIE, tirerCarteAleatoire } from "@/lib/cartesConfig";
import SemainePicker from "@/components/dashboard/SemainePicker";
import TirageModal from "@/components/cartes/TirageModal";
import HistoriqueTirages from "@/components/cartes/HistoriqueTirages";
import BonusEquipePanel from "@/components/cartes/BonusEquipePanel";
import { CreditCard, Shuffle } from "lucide-react";
import MissionRow from "@/components/cartes/MissionRow";
import { Button } from "@/components/ui/button";





function calculerMissionsEquipe(ventesEquipe) {
  const missions = MISSIONS.map((mission) => {
    let total = 0;
    const ventesMatchees = [];
    for (const v of ventesEquipe) {
      const labMatch = v.laboratoire?.toUpperCase()?.trim() === mission.laboratoire.toUpperCase();
      const produitMatch = produitMatchDucray(v.produit, mission);
      if (labMatch && produitMatch) {
        total += v.quantite || 1;
        ventesMatchees.push({ operateur: v.operateur, produit: v.produit, quantite: v.quantite || 1 });
      }
    }
    const pct = Math.min(100, Math.round((total / mission.objectif) * 100));
    return { ...mission, total, pct, done: total >= mission.objectif, ventesMatchees };
  });

  return missions;
}

export default function Cartes() {
  const { semaine, setSemaine } = useSemaine();
  const [tirageModal, setTirageModal] = useState(null); // { equipe, type, cartesRestantes } | null
  const [equipeEnVue, setEquipeEnVue] = useState(null); // Équipe actuellement en vue

  const qc = useQueryClient();

  const { data: ventes = [], isLoading } = useQuery({
    queryKey: ["ventes-operateurs"],
    queryFn: () => challengeBase44.entities.VentesOperateurs.list("-created_date", 10000),
  });

  const { data: tirages = [] } = useQuery({
    queryKey: ["tirages-cartes"],
    queryFn: () => challengeBase44.entities.TirageCartes.list("-created_date", 500),
  });

  const { data: bonusEquipes = [] } = useQuery({
    queryKey: ["bonus-equipe"],
    queryFn: () => challengeBase44.entities.BonusEquipe.list("-created_date", 500),
  });

  const { data: operateurs = [] } = useQuery({
    queryKey: ["operateurs"],
    queryFn: () => challengeBase44.entities.Operateur.list(),
  });

  const saveTirage = useMutation({
    mutationFn: (data) => challengeBase44.entities.TirageCartes.create(data),
    onSuccess: () => qc.invalidateQueries(["tirages-cartes"]),
  });

  const toggleApplique = useMutation({
    mutationFn: ({ id, applique }) => challengeBase44.entities.TirageCartes.update(id, { applique }),
    onSuccess: () => qc.invalidateQueries(["tirages-cartes"]),
  });

  const semaines = useMemo(() => getSemainesDisponibles(ventes), [ventes]);
  const ventesFiltrees = useMemo(() => filtrerVentesParSemaine(ventes, semaine), [ventes, semaine]);

  const PTS_LABO = { NUTERGIA: 1, SOLGAR: 1.5, DUCRAY: 2 };
  function calcPtsEquipe(ventes) {
    return ventes.reduce((sum, v) => {
      const pts = PTS_LABO[v.laboratoire?.toUpperCase()?.trim()] || 0;
      return sum + pts * (v.quantite || 1);
    }, 0);
  }

  const equipeStats = useMemo(() => {
    // Pour les missions, on ne compte jamais en "global" pour éviter le double-comptage :
    // on prend le max de missions accomplies sur une semaine individuelle.
    // Pour les points (cartes par pts), on utilise les ventes filtrées normalement.
    const ventesParEquipe = {};
    for (const equipe of Object.keys(EQUIPES)) ventesParEquipe[equipe] = [];
    for (const v of ventesFiltrees) {
      const eq = getEquipeOfOperateur(normalizeOperateur(v.operateur));
      if (eq) ventesParEquipe[eq].push(v);
    }

    // Calcul des missions : si global, on prend le max sur chaque semaine
    const ventesTotal = ventes; // toutes les ventes
    const semainesDispos = getSemainesDisponibles(ventesTotal);

    return Object.entries(EQUIPES).map(([nom, config]) => {
      const ventesEq = ventesParEquipe[nom] || [];
      
      // DEBUG
      const ducrayEq = ventesEq.filter(v => v.laboratoire?.toUpperCase()?.trim() === "DUCRAY");
      if (ducrayEq.length > 0) {
        console.log(`[${nom}] Ducray reçues:`, ducrayEq.map(v => `${v.produit} (${v.operateur})`));
      }
      
      const ptsVentes = calcPtsEquipe(ventesEq);
      // Bonus/malus manuels pour cette équipe sur la période sélectionnée
      const bonusEq = bonusEquipes.filter(b => {
        if (b.equipe !== nom) return false;
        if (semaine === "global") return true;
        return b.semaine === semaine;
      });
      const bonusPts = bonusEq.reduce((sum, b) => sum + (b.points || 0), 0);
      const pts = ptsVentes + bonusPts;
      // Les cartes par points se basent UNIQUEMENT sur les pts de ventes (pas les ajustements manuels)
      // Et en vue globale, on compte le nombre de tranches de 80 pts par semaine (remise à zéro chaque semaine)
      let cartesParPts;
      if (semaine === "global" && semainesDispos.length > 0) {
        cartesParPts = 0;
        for (const s of semainesDispos) {
          const ventesS = filtrerVentesParSemaine(ventesTotal, s).filter(v =>
            getEquipeOfOperateur(normalizeOperateur(v.operateur)) === nom
          );
          const ptsS = calcPtsEquipe(ventesS);
          if (ptsS >= 80) cartesParPts += 1;
        }
      } else {
        cartesParPts = ptsVentes >= 80 ? 1 : 0;
      }

       let missions;
       let cartesParMissions = 0;

       if (semaine === "global" && semainesDispos.length > 0) {
         // Compter les cartes par missions avec objectifs cumulés par semaine
         cartesParMissions = 0;
         for (const mission of MISSIONS) {
           let totalCumulé = 0;
           let objectifCumulé = 0;
           for (const s of semainesDispos) {
             const ventesS = filtrerVentesParSemaine(ventesTotal, s).filter(v =>
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

         // Pour l'affichage, on utilise les missions sur toutes les ventes
         missions = calculerMissionsEquipe(ventesEq);
       } else {
         missions = calculerMissionsEquipe(ventesEq);
         cartesParMissions = missions.filter(m => m.done).length;
       }

       const cartesTotal = cartesParPts + cartesParMissions;
      return { nom, config, missions, cartesTotal, cartesParPts, cartesParMissions, pts, ptsVentes, bonusPts };
    }).sort((a, b) => b.cartesTotal - a.cartesTotal);
  }, [ventesFiltrees, ventes, semaine]);

  // Tirages de la semaine sélectionnée (ou tous si global)
  const tiragesSemaine = useMemo(() => {
    const filtered = semaine === "global" ? tirages : tirages.filter(t => t.semaine === semaine);
    console.log("DEBUG: semaine=", semaine, "tirages totaux=", tirages.length, "filtrés=", filtered.length, "détails=", tirages.slice(0, 3));
    return filtered;
  }, [tirages, semaine]);

  // Références pour tracker les équipes visibles
  const detailRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => {
      let visibleTeam = null;
      let closestDistance = Infinity;

      // Chercher l'équipe la plus proche du centre de la fenêtre
      Object.entries(detailRefs.current).forEach(([teamName, ref]) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            visibleTeam = teamName;
          }
        }
      });

      setEquipeEnVue(visibleTeam);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function ouvrirTirage(equipe, type, cartesRestantes) {
    setTirageModal({ equipe, type, cartesRestantes });
  }

  function confirmerTirage(equipe, type, carte) {
    saveTirage.mutate({
      equipe,
      type_carte: type,
      carte_id: carte.id,
      carte_nom: carte.nom,
      semaine,
      applique: false,
    });
    // S'il reste d'autres cartes à tirer, rouvrir le modal
    const restantes = (tirageModal?.cartesRestantes || 1) - 1;
    if (restantes > 0) {
      const types = ["bonus", "malus", "strategie"];
      setTirageModal({
        equipe,
        type: types[Math.floor(Math.random() * types.length)],
        cartesRestantes: restantes,
      });
    } else {
      setTirageModal(null);
    }
  }

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
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #bfdbfe 0%, transparent 70%)" }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl glass">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Cartes & Tirages</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {semaine === "global" ? "Toute la période" : labelSemaine(semaine)}
              </p>
            </div>
          </div>
          <SemainePicker semaines={semaines} value={semaine} onChange={setSemaine} />
        </div>

        {/* Score global par équipe + boutons de tirage - STICKY */}
        <div className="sticky top-0 z-30 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 pb-4" style={{ background: "linear-gradient(180deg, #ffffff 0%, #ffffff 90%, transparent 100%)" }}>
          {equipeStats.map((eq, idx) => {
            const colors = TEAM_COLORS[eq.config.color || "emerald"];
            const medals = ["🥇", "🥈", "🥉"];
            // Cartes disponibles = cartes débloquées - tirages déjà effectués pour la même période
            const cartesDispos = eq.cartesTotal;
            const tiragesEquipe = tirages.filter(t => {
              if (t.equipe !== eq.nom) return false;
              if (semaine === "global") return true;
              return t.semaine === semaine;
            }).length;
            const cartesRestantes = Math.max(0, cartesDispos - tiragesEquipe);
            const isCurrentTeam = equipeEnVue === eq.nom;
            const shouldBlur = equipeEnVue && !isCurrentTeam;

            return (
              <div 
                key={eq.nom} 
                className={`glass rounded-2xl px-5 py-4 transition-all ${idx === 0 ? "glass-strong ring-2 " + colors.ring : ""} ${shouldBlur ? "opacity-30 blur-sm" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{medals[idx] || "🎴"}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {cartesRestantes} carte{cartesRestantes !== 1 ? "s" : ""} dispo
                  </span>
                </div>
                <h3 className={`font-bold text-lg ${colors.text}`}>{eq.nom}</h3>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{eq.cartesTotal}</p>
                <p className="text-sm text-slate-400 mb-1">carte{eq.cartesTotal > 1 ? "s" : ""} débloquée{eq.cartesTotal > 1 ? "s" : ""}</p>
                <div className="text-xs text-slate-400 mb-3 space-y-0.5">
                  <p>🎯 {eq.cartesParMissions} mission{eq.cartesParMissions !== 1 ? "s" : ""} / {MISSIONS.length}</p>
                  <p>⭐ {eq.ptsVentes.toFixed(1)} pts ventes → {eq.cartesParPts === 1 ? "1 carte (≥80 pts)" : "0 carte (<80 pts)"}{eq.bonusPts !== 0 && <span className={eq.bonusPts > 0 ? " text-emerald-600" : " text-red-500"}> · ajust. {eq.bonusPts > 0 ? "+" : ""}{eq.bonusPts} pts</span>}</p>
                </div>

                {/* Boutons tirage : autant que de cartes restantes */}
                <div className="space-y-1.5">
                  {cartesRestantes > 0 && (
                    <button
                      onClick={() => {
                        const types = ["bonus", "malus", "strategie"];
                        ouvrirTirage(eq.nom, types[Math.floor(Math.random() * types.length)], cartesRestantes);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                    >
                      <Shuffle className="w-3 h-3" />
                      Tirer une carte
                      <span className="ml-1 opacity-60">({cartesRestantes} restante{cartesRestantes > 1 ? "s" : ""})</span>
                    </button>
                  )}
                  {cartesRestantes === 0 && cartesDispos > 0 && (
                    <p className="text-xs text-center text-slate-400 italic">Toutes les cartes ont été tirées</p>
                  )}
                  {cartesDispos === 0 && (
                    <p className="text-xs text-center text-slate-400 italic">Aucune carte débloquée</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Détail missions par équipe */}
        <div className="space-y-6 mt-6">
          {equipeStats.map((eq) => {
            const colors = TEAM_COLORS[eq.config.color || "emerald"];
            const isCurrentTeam = equipeEnVue === eq.nom;
            const shouldBlur = equipeEnVue && !isCurrentTeam;
            
            return (
              <div 
                key={eq.nom} 
                ref={(el) => { detailRefs.current[eq.nom] = el; }}
                className={`glass rounded-2xl overflow-hidden transition-all ${shouldBlur ? "opacity-30 blur-sm" : ""}`}
                onMouseEnter={() => setEquipeEnVue(eq.nom)}
                onMouseLeave={() => setEquipeEnVue(null)}
              >
                <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.06]" style={{ background: "rgba(0,0,0,0.02)" }}>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{eq.nom}</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">{eq.cartesTotal} carte{eq.cartesTotal > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {eq.missions.map((m) => (
                    <MissionRow key={m.id} m={m} colors={colors} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ajustements de points équipe */}
        <BonusEquipePanel semaine={semaine} />

        {/* Historique tirages de la semaine — tout en bas */}
        {tiragesSemaine.length > 0 && (
          <div 
            ref={(el) => { detailRefs.current["historique"] = el; }}
            onClick={() => setEquipeEnVue("historique")}
            className={`mt-6 transition-all cursor-pointer ${equipeEnVue && equipeEnVue !== "historique" ? "opacity-30 blur-sm" : ""}`}
          >
            <HistoriqueTirages tirages={tiragesSemaine} semaine={semaine} onToggleApplique={toggleApplique.mutate} />
          </div>
        )}
      </div>

      {/* Modal tirage */}
      {tirageModal && (
        <TirageModal
          equipe={tirageModal.equipe}
          type={tirageModal.type}
          cartesRestantes={tirageModal.cartesRestantes}
          onConfirm={confirmerTirage}
          onClose={() => setTirageModal(null)}
        />
      )}
    </div>
  );
}
