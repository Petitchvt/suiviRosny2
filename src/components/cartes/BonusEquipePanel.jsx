import { useState, useMemo } from "react";
import { challengeBase44 } from "@/api/moduleClients";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EQUIPES, TEAM_COLORS } from "@/lib/teamsConfig";
import { Plus, Minus, Trash2, PlusCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EQUIPES_LIST = Object.keys(EQUIPES);
const ALL_MEMBRES = Object.entries(EQUIPES).flatMap(([equipe, cfg]) => cfg.membres.map(m => ({ nom: m, equipe })));

export default function BonusEquipePanel({ semaine }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState("transfert"); // "transfert" | "direct" | "operateur"
  const [form, setForm] = useState({
    equipeSource: EQUIPES_LIST[0],
    equipeCible: EQUIPES_LIST[1],
    points: "",
    raison: "",
  });
  const [directForm, setDirectForm] = useState({
    equipe: EQUIPES_LIST[0],
    points: "",
    raison: "",
  });
  const [opForm, setOpForm] = useState({
    operateur: ALL_MEMBRES[0]?.nom || "",
    cible: "equipe", // "equipe" | "perdu"
    equipe: EQUIPES_LIST[0],
    points: "",
    raison: "",
  });

  const { data: bonus = [] } = useQuery({
    queryKey: ["bonus-equipe"],
    queryFn: () => challengeBase44.entities.BonusEquipe.list("-created_date", 500),
  });

  const addBonus = useMutation({
    mutationFn: (data) => challengeBase44.entities.BonusEquipe.create(data),
    onSuccess: () => qc.invalidateQueries(["bonus-equipe"]),
  });

  const deleteBonus = useMutation({
    mutationFn: (id) => challengeBase44.entities.BonusEquipe.delete(id),
    onSuccess: () => qc.invalidateQueries(["bonus-equipe"]),
  });

  const bonusSemaine = semaine === "global" ? bonus : bonus.filter(b => b.semaine === semaine);

  // Grouper les entrées par transfer_id pour afficher les transferts comme des paires
  const transferts = useMemo(() => {
    const grouped = {};
    const orphans = [];

    for (const b of bonusSemaine) {
      if (b.transfer_id) {
        if (!grouped[b.transfer_id]) grouped[b.transfer_id] = [];
        grouped[b.transfer_id].push(b);
      } else {
        orphans.push(b);
      }
    }

    const result = [];

    // Paires de transferts
    for (const [tid, entries] of Object.entries(grouped)) {
      const source = entries.find(e => e.points < 0);
      const cible = entries.find(e => e.points > 0);
      if (source && cible) {
        result.push({
          type: "transfer",
          transfer_id: tid,
          source,
          cible,
          pts: Math.abs(cible.points),
          raison: cible.raison,
          date: new Date(cible.created_date),
          ids: entries.map(e => e.id),
        });
      } else {
        // Entrées incomplètes → orphans
        entries.forEach(e => orphans.push(e));
      }
    }

    // Entrées sans transfer_id
    for (const b of orphans) {
      result.push({ type: "single", entry: b });
    }

    // Trier par date décroissante
    result.sort((a, b) => {
      const da = a.type === "transfer" ? a.date : new Date(a.entry.created_date);
      const db = b.type === "transfer" ? b.date : new Date(b.entry.created_date);
      return db - da;
    });

    return result;
  }, [bonusSemaine]);

  async function handleTransfert() {
    const pts = parseFloat(form.points);
    if (!pts || isNaN(pts) || form.equipeSource === form.equipeCible) return;
    const sem = semaine === "global" ? "global" : semaine;
    const raison = form.raison || "";
    const ptsVal = Math.abs(pts);
    const transfer_id = crypto.randomUUID();

    await addBonus.mutateAsync({ equipe: form.equipeSource, points: -ptsVal, raison, semaine: sem, transfer_id });
    await addBonus.mutateAsync({ equipe: form.equipeCible, points: ptsVal, raison, semaine: sem, transfer_id });

    setForm(f => ({ ...f, points: "", raison: "" }));
  }

  async function annulerTransfert(ids) {
    for (const id of ids) {
      await deleteBonus.mutateAsync(id);
    }
  }

  async function handleDirect(sign) {
    const pts = parseFloat(directForm.points);
    if (!pts || isNaN(pts)) return;
    const sem = semaine === "global" ? "global" : semaine;
    await addBonus.mutateAsync({
      equipe: directForm.equipe,
      points: sign * Math.abs(pts),
      raison: directForm.raison || "",
      semaine: sem,
    });
    setDirectForm(f => ({ ...f, points: "", raison: "" }));
  }

  async function handleOperateur(sign) {
    const pts = parseFloat(opForm.points);
    if (!pts || isNaN(pts) || !opForm.operateur) return;

    const ptsVal = sign * Math.abs(pts); // positif si "Ajouter", négatif si "Retirer"
    const mem = ALL_MEMBRES.find(m => m.nom === opForm.operateur);
    const equipeOp = mem?.equipe || EQUIPES_LIST[0];
    const sem = semaine === "global" ? "global" : semaine;
    const raison = opForm.raison || "";
    const transfer_id = crypto.randomUUID();

    if (opForm.cible === "equipe") {
      // Opérateur transfère des points vers une équipe (son équipe perd, l'équipe cible gagne)
      await addBonus.mutateAsync({
        equipe: equipeOp,
        points: -Math.abs(ptsVal),
        raison,
        semaine: sem,
        transfer_id,
        operateur_nom: opForm.operateur,
      });
      await addBonus.mutateAsync({
        equipe: opForm.equipe,
        points: Math.abs(ptsVal),
        raison,
        semaine: sem,
        transfer_id,
      });
    } else {
      // Ajustement direct de l'opérateur (positif ou négatif)
      await addBonus.mutateAsync({
        equipe: equipeOp,
        points: ptsVal,
        raison,
        semaine: sem,
        operateur_nom: opForm.operateur,
      });
    }

    setOpForm(f => ({ ...f, points: "", raison: "" }));
  }

  return (
    <div className="glass rounded-2xl overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between" style={{ background: "rgba(0,0,0,0.02)" }}>
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-slate-400" />
          <h2 className="font-bold text-slate-800">Ajustements de points équipe</h2>
        </div>
        {/* Toggle mode */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setMode("transfert")}
            className={`px-3 py-1.5 transition-colors ${mode === "transfert" ? "bg-blue-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            Transfert équipes
          </button>
          <button
            onClick={() => setMode("direct")}
            className={`px-3 py-1.5 transition-colors ${mode === "direct" ? "bg-blue-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            Équipe directe
          </button>
          <button
            onClick={() => setMode("operateur")}
            className={`px-3 py-1.5 transition-colors ${mode === "operateur" ? "bg-blue-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            Opérateur
          </button>
        </div>
      </div>

      {/* Formulaire ajustement direct */}
      {mode === "direct" && (
        <div className="px-5 py-4 border-b border-black/[0.06] flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Équipe</label>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={directForm.equipe}
              onChange={e => setDirectForm(f => ({ ...f, equipe: e.target.value }))}
            >
              {EQUIPES_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Points</label>
            <Input
              type="number"
              step="any"
              placeholder="ex: 10"
              className="w-24 h-9"
              value={directForm.points}
              onChange={e => setDirectForm(f => ({ ...f, points: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-xs text-slate-500">Raison (optionnel)</label>
            <Input
              placeholder="ex: Pénalité retard"
              className="h-9"
              value={directForm.raison}
              onChange={e => setDirectForm(f => ({ ...f, raison: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1" onClick={() => handleDirect(1)} disabled={!directForm.points || addBonus.isPending}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1" onClick={() => handleDirect(-1)} disabled={!directForm.points || addBonus.isPending}>
              <Minus className="w-3.5 h-3.5" /> Retirer
            </Button>
          </div>
        </div>
      )}

      {/* Formulaire transfert */}
      {mode === "transfert" && <div className="px-5 py-4 border-b border-black/[0.06] flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Équipe qui donne</label>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
            value={form.equipeSource}
            onChange={e => setForm(f => ({ ...f, equipeSource: e.target.value }))}
          >
            {EQUIPES_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-400 self-end mb-2" />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Équipe qui reçoit</label>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
            value={form.equipeCible}
            onChange={e => setForm(f => ({ ...f, equipeCible: e.target.value }))}
          >
            {EQUIPES_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Points</label>
          <Input
            type="number"
            step="any"
            placeholder="ex: 10"
            className="w-24 h-9"
            value={form.points}
            onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-xs text-slate-500">Raison (optionnel)</label>
          <Input
            placeholder="ex: Carte bonus"
            className="h-9"
            value={form.raison}
            onChange={e => setForm(f => ({ ...f, raison: e.target.value }))}
          />
        </div>

        <Button
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white gap-1"
          onClick={handleTransfert}
          disabled={!form.points || form.equipeSource === form.equipeCible || addBonus.isPending}
        >
          <Plus className="w-3.5 h-3.5" /> Transférer
        </Button>
      </div>
      }

      {/* Formulaire opérateur */}
      {mode === "operateur" && (
        <div className="px-5 py-4 border-b border-black/[0.06] flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Opérateur</label>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={opForm.operateur}
              onChange={e => setOpForm(f => ({ ...f, operateur: e.target.value }))}
            >
              {ALL_MEMBRES.map(m => <option key={m.nom} value={m.nom}>{m.nom} ({m.equipe})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Points vont à</label>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={opForm.cible}
              onChange={e => setOpForm(f => ({ ...f, cible: e.target.value }))}
            >
              <option value="equipe">Une équipe</option>
              <option value="perdu">Points perdus (personne)</option>
            </select>
          </div>
          {opForm.cible === "equipe" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Équipe bénéficiaire</label>
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                value={opForm.equipe}
                onChange={e => setOpForm(f => ({ ...f, equipe: e.target.value }))}
              >
                {EQUIPES_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Points</label>
            <Input
              type="number"
              step="any"
              placeholder="ex: 5"
              className="w-24 h-9"
              value={opForm.points}
              onChange={e => setOpForm(f => ({ ...f, points: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-xs text-slate-500">Raison (optionnel)</label>
            <Input
              placeholder="ex: Carte malus"
              className="h-9"
              value={opForm.raison}
              onChange={e => setOpForm(f => ({ ...f, raison: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1" onClick={() => handleOperateur(1)} disabled={!opForm.points || addBonus.isPending}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-1" onClick={() => handleOperateur(-1)} disabled={!opForm.points || addBonus.isPending}>
              <Minus className="w-3.5 h-3.5" /> Retirer
            </Button>
          </div>
        </div>
      )}

      {mode === "transfert" && form.equipeSource === form.equipeCible && (
        <p className="px-5 py-2 text-xs text-red-400 italic">Les deux équipes doivent être différentes</p>
      )}

      {/* Résumé net par équipe */}
      {(() => {
        const totaux = {};
        for (const b of bonusSemaine) {
          if (!totaux[b.equipe]) totaux[b.equipe] = 0;
          totaux[b.equipe] += b.points || 0;
        }
        const equipes = Object.entries(totaux).filter(([, pts]) => pts !== 0);
        if (equipes.length === 0) return null;
        return (
          <div className="px-5 py-3 flex flex-wrap gap-3 border-b border-black/[0.06] bg-slate-50/60">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-full">Total net par équipe :</span>
            {equipes.map(([eq, pts]) => {
              const colors = TEAM_COLORS[EQUIPES[eq]?.color || "emerald"];
              return (
                <span key={eq} className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                  {eq} : {pts > 0 ? "+" : ""}{pts.toFixed(2)} pts
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* Historique des transferts */}
      <div className="divide-y divide-black/[0.04]">
        {transferts.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400 italic">Aucun transfert pour cette période</p>
        ) : (
          transferts.map((t, idx) => {
            if (t.type === "transfer") {
              const colorsSource = TEAM_COLORS[EQUIPES[t.source.equipe]?.color || "emerald"];
              const colorsCible = TEAM_COLORS[EQUIPES[t.cible.equipe]?.color || "emerald"];
              const operateurNom = t.source.operateur_nom;
              return (
                <div key={t.transfer_id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02]">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                    {operateurNom ? (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">👤 {operateurNom}</span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorsSource.badge}`}>{t.source.equipe}</span>
                    )}
                    <span className="text-red-500 font-bold text-sm">−{t.pts}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorsCible.badge}`}>{t.cible.equipe}</span>
                    <span className="text-emerald-500 font-bold text-sm">+{t.pts}</span>
                    {t.raison && <span className="text-xs text-slate-500 italic">· {t.raison}</span>}
                    <span className="text-xs text-slate-400 ml-auto">{t.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <button
                    onClick={() => annulerTransfert(t.ids)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors flex-shrink-0"
                    title="Annuler ce transfert"
                  >
                    <RotateCcw className="w-3 h-3" /> Annuler
                  </button>
                </div>
              );
            } else {
              // Entrée orpheline (ancienne) ou ajustement direct opérateur
              const isPerdu = t.entry.equipe === "__perdu__";
              const config = EQUIPES[t.entry.equipe];
              const colors = TEAM_COLORS[config?.color || "emerald"];
              const isPositif = t.entry.points > 0;
              const opNom = t.entry.operateur_nom;
              return (
                <div key={t.entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02]">
                  <span className={`text-base font-bold w-10 text-center ${isPositif ? "text-emerald-500" : "text-red-500"}`}>
                    {isPositif ? "+" : ""}{t.entry.points}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {opNom ? (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">👤 {opNom}</span>
                      ) : isPerdu ? (
                        <span className="text-xs font-bold text-slate-400 italic">Points perdus</span>
                      ) : (
                        <span className={`text-xs font-bold ${colors.text}`}>{t.entry.equipe}</span>
                      )}
                      {t.entry.raison && <span className="text-sm text-slate-600">{t.entry.raison}</span>}
                    </div>
                    <p className="text-xs text-slate-400">{t.entry.semaine} · {new Date(t.entry.created_date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => deleteBonus.mutate(t.entry.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
