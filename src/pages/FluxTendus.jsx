import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import HistoriqueEncart from "../components/flux-tendu/HistoriqueEncart";

export default function FluxTendus() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ongletActif, setOngletActif] = useState("Général");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [modeComparaison, setModeComparaison] = useState("s1_vs_s");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const acheteurs = ["Général", "Riad", "Cedric", "Jadujan"];

  const modesComparaison = [
    { key: "s4_vs_s3", labelA: "S-4", labelB: "S-3", fieldA: "ventes_s4", fieldB: "ventes_s3", semA: "semaine_s4", semB: "semaine_s3", colorA: "#9ca3af", colorB: "#7c3aed" },
    { key: "s3_vs_s2", labelA: "S-3", labelB: "S-2", fieldA: "ventes_s3", fieldB: "ventes_s2", semA: "semaine_s3", semB: "semaine_s2", colorA: "#7c3aed", colorB: "#f472b6" },
    { key: "s2_vs_s1", labelA: "S-2", labelB: "S-1", fieldA: "ventes_s2", fieldB: "ventes_s1", semA: "semaine_s2", semB: "semaine_s1", colorA: "#f472b6", colorB: "#60a5fa" },
    { key: "s1_vs_s",  labelA: "S-1", labelB: "S",   fieldA: "ventes_s1", fieldB: "ventes_s",  semA: "semaine_s1", semB: "semaine_s",  colorA: "#1e40af", colorB: "#166534" },
  ];

  const modeActif = modesComparaison.find(m => m.key === modeComparaison);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const result = await base44.entities.SuiviFluxTendu.list();
    setData(result);
    if (result.length > 0) {
      const dates = result.map(r => r.updated_at).filter(Boolean).sort().reverse();
      setLastUpdate(dates[0]);
    }
    setLoading(false);
  }

  const produitsBase = ongletActif === "Général" ? data : data.filter(d => d.acheteur === ongletActif);

  function valeurTri(p) {
    if (!sortCol) return 0;
    if (sortCol === "libelle") return (p.libelle || "").toLowerCase();
    if (sortCol === "acheteur") return (p.acheteur || "").toLowerCase();
    if (sortCol === "laboratoire") return (p.laboratoire || "").toLowerCase();
    if (sortCol === "note") return (p.note || "").toLowerCase();
    if (sortCol === "valA") return p[modeActif.fieldA] ?? -Infinity;
    if (sortCol === "valB") return p[modeActif.fieldB] ?? -Infinity;
    if (sortCol === "stock") return p.stock_restant ?? -Infinity;
    if (sortCol === "tendance") return (p[modeActif.fieldB] ?? 0) - (p[modeActif.fieldA] ?? 0);
    return 0;
  }

  const produitsFiltres = sortCol
    ? [...produitsBase].sort((a, b) => {
        const va = valeurTri(a);
        const vb = valeurTri(b);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : produitsBase;

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>⇅</span>;
    return <span style={{ marginLeft: "4px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function tendance(s, s1) {
    if (s > s1) return { icon: "▲", color: "#16a34a" };
    if (s < s1) return { icon: "▼", color: "#dc2626" };
    return { icon: "●", color: "#d97706" };
  }

  function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const thStyle = {
    padding: "10px 12px", textAlign: "center", fontSize: "11px",
    fontWeight: "600", color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap", cursor: "pointer", userSelect: "none"
  };

  const ref0 = produitsFiltres[0];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f8fafc", padding: "24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
          📦 Suivi Flux Tendus
        </h1>
        <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
          Dernière mise à jour : {lastUpdate ? formatDate(lastUpdate) : "—"}
          <button onClick={loadData} style={{
            marginLeft: "12px", fontSize: "12px", color: "#3b82f6",
            background: "none", border: "none", cursor: "pointer", textDecoration: "underline"
          }}>↻ Rafraîchir</button>
        </p>
      </div>

      {/* Onglets acheteurs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {acheteurs.map(a => (
          <button key={a} onClick={() => setOngletActif(a)} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontWeight: ongletActif === a ? "700" : "400",
            background: ongletActif === a ? "#0f172a" : "#e2e8f0",
            color: ongletActif === a ? "#ffffff" : "#475569",
            fontSize: "14px"
          }}>{a}</button>
        ))}
      </div>

      {/* Sélecteur de comparaison (menu déroulant) */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comparaison :</span>
        <select
          value={modeComparaison}
          onChange={e => setModeComparaison(e.target.value)}
          style={{
            padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
            background: "white", fontSize: "13px", fontWeight: "600", color: "#0f172a",
            cursor: "pointer", outline: "none"
          }}
        >
          {modesComparaison.map(m => (
            <option key={m.key} value={m.key}>{m.labelA} vs {m.labelB}</option>
          ))}
        </select>
      </div>

      {/* Badges semaines actives */}
      {ref0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ background: "#f1f5f9", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", color: modeActif.colorA, fontWeight: "600" }}>
            📅 {ref0[modeActif.semA] || modeActif.labelA}
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", color: modeActif.colorB, fontWeight: "600" }}>
            📅 {ref0[modeActif.semB] || modeActif.labelB}
          </div>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Chargement...</div>
      ) : produitsFiltres.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", background: "white", borderRadius: "12px" }}>
          Aucun produit suivi pour {ongletActif}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ ...thStyle, width: "32px", cursor: "default" }}></th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: "200px" }} onClick={() => handleSort("libelle")}>Produit<SortIcon col="libelle" /></th>
                {ongletActif === "Général" && <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("acheteur")}>Acheteur<SortIcon col="acheteur" /></th>}
                <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("laboratoire")}>Laboratoire<SortIcon col="laboratoire" /></th>
                <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("note")}>Note<SortIcon col="note" /></th>
                <th style={{ ...thStyle, color: modeActif.colorA }} onClick={() => handleSort("valA")}>Ventes {modeActif.labelA}<SortIcon col="valA" /></th>
                <th style={{ ...thStyle, color: modeActif.colorB }} onClick={() => handleSort("valB")}>Ventes {modeActif.labelB}<SortIcon col="valB" /></th>
                <th style={{ ...thStyle }} onClick={() => handleSort("stock")}>Stock<SortIcon col="stock" /></th>
                <th style={{ ...thStyle }} onClick={() => handleSort("tendance")}>Tend.<SortIcon col="tendance" /></th>
              </tr>
            </thead>
            <tbody>
              {produitsFiltres.map((p, i) => {
                const valA = p[modeActif.fieldA] ?? 0;
                const valB = p[modeActif.fieldB] ?? 0;
                const t = tendance(valB, valA);
                const stockAlerte = p.stock_restant != null && p.ventes_s1 != null && p.stock_restant < p.ventes_s1;
                const isOpen = !!expanded[p.id];
                const rowBg = i % 2 === 0 ? "white" : "#fafafa";
                return (
                  <>
                    <tr key={p.id} style={{ borderBottom: isOpen ? "none" : "1px solid #f1f5f9", background: rowBg }}>
                      {/* Toggle arrow */}
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpand(p.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "12px", color: "#94a3b8",
                            transition: "transform 0.2s",
                            display: "inline-block",
                            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"
                          }}
                        >▶</button>
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#0f172a", fontWeight: "500" }}>
                        {p.libelle}
                      </td>
                      {ongletActif === "Général" && (
                        <td style={{ padding: "12px", fontSize: "12px", color: "#0f172a", fontWeight: "600" }}>
                          {p.acheteur}
                        </td>
                      )}
                      <td style={{ padding: "12px", fontSize: "12px", color: "#475569" }}>
                        {p.laboratoire}
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "#7c3aed", fontStyle: p.note ? "normal" : "italic" }}>
                        {p.note || "—"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontSize: "15px", fontWeight: "600", color: modeActif.colorA }}>
                        {valA}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontSize: "15px", fontWeight: "600", color: modeActif.colorB }}>
                        {valB}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: stockAlerte ? "#dc2626" : "#0f172a" }}>
                          {p.stock_restant ?? 0}
                          {stockAlerte && " ⚠️"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontSize: "20px", color: t.color, fontWeight: "700" }}>
                        {t.icon}
                      </td>
                    </tr>

                    {/* Encart historique déroulant */}
                    {isOpen && (
                      <tr key={`${p.id}-detail`} style={{ background: rowBg, borderBottom: "1px solid #f1f5f9" }}>
                        <td></td>
                        <td colSpan={ongletActif === "Général" ? 8 : 7} style={{ padding: "0 12px 16px 12px" }}>
                          <HistoriqueEncart produit={p} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}