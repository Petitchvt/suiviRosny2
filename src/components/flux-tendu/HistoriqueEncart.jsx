import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

export default function HistoriqueEncart({ produit: p }) {
  const [mode, setMode] = useState("chiffres"); // "chiffres" | "graphique"

  const historique = [
    { semaine: p.semaine_s4 || "S-4", ventes: p.ventes_s4 ?? 0, color: "#9ca3af" },
    { semaine: p.semaine_s3 || "S-3", ventes: p.ventes_s3 ?? 0, color: "#a78bfa" },
    { semaine: p.semaine_s2 || "S-2", ventes: p.ventes_s2 ?? 0, color: "#f472b6" },
    { semaine: p.semaine_s1 || "S-1", ventes: p.ventes_s1 ?? 0, color: "#60a5fa" },
  ];

  return (
    <div style={{
      background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0",
      padding: "14px 16px", marginTop: "4px"
    }}>
      {/* Header encart */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          📊 Historique S-1 · S-2 · S-3 · S-4
        </span>
        {/* Switch chiffres / graphique */}
        <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "6px", padding: "2px", gap: "2px" }}>
          {["chiffres", "graphique"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "4px 10px", borderRadius: "5px", border: "none", cursor: "pointer",
                fontSize: "11px", fontWeight: "600",
                background: mode === m ? "white" : "transparent",
                color: mode === m ? "#0f172a" : "#64748b",
                boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s"
              }}
            >
              {m === "chiffres" ? "🔢 Chiffres" : "📈 Graphique"}
            </button>
          ))}
        </div>
      </div>

      {mode === "chiffres" ? (
        <div style={{ display: "flex", gap: "12px" }}>
          {historique.map(h => (
            <div key={h.semaine} style={{
              flex: 1, background: "white", borderRadius: "8px", padding: "10px 14px",
              border: "1px solid #e2e8f0", textAlign: "center"
            }}>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", marginBottom: "4px" }}>
                {h.semaine}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: h.color }}>
                {h.ventes}
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>ventes</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ height: "120px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historique} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="semaine" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                formatter={(v) => [v, "Ventes"]}
              />
              <Bar dataKey="ventes" radius={[4, 4, 0, 0]}>
                {historique.map((h, i) => <Cell key={i} fill={h.color} />)}
                <LabelList dataKey="ventes" position="insideTop" style={{ fontSize: "10px", fontWeight: "700", fill: "white" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {p.updated_at && (
        <div style={{ textAlign: "right", fontSize: "10px", color: "#94a3b8", fontStyle: "italic", marginTop: "10px" }}>
          Mise à jour : {new Date(p.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}