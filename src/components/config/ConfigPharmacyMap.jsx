import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Grille 2D : chaque cellule = { id, row, col } ou null (vide)
// La grille est stockée comme un tableau de rangées, chaque rangée a 2 slots max
// On représente la grille comme un tableau plat de cellules { tgId, row, col }

export default function ConfigPharmacyMap({ tgList, onMove }) {
  // Construire une grille à partir des positions (row, col) stockées ou générées
  // On utilise les champs ordre (position linéaire) pour déduire row/col si pas de pos dédiée
  // Format attendu : tg.map_row, tg.map_col (sinon on génère une grille par défaut)

  const COLS = 2;

  // Trouver la dimension de la grille
  const hasPosData = tgList.some(t => t.map_row !== undefined && t.map_row !== null);

  let grid = {}; // clé "row-col" => tg

  if (hasPosData) {
    tgList.forEach(t => {
      if (t.map_row !== undefined && t.map_col !== undefined) {
        grid[`${t.map_row}-${t.map_col}`] = t;
      }
    });
  } else {
    // Disposition par défaut : 2 colonnes, rangées successives
    tgList.forEach((t, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      grid[`${row}-${col}`] = t;
    });
  }

  const maxRow = Math.max(...Object.keys(grid).map(k => parseInt(k.split('-')[0])), 0);
  const rows = maxRow + 1;

  const getTG = (r, c) => grid[`${r}-${c}`] || null;

  const canMove = (tg, dr, dc) => {
    if (!tg) return false;
    const currentKey = Object.keys(grid).find(k => grid[k]?.id === tg.id);
    if (!currentKey) return false;
    const [r, c] = currentKey.split('-').map(Number);
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nc >= COLS) return false;
    return true;
  };

  const handleMove = (tg, dr, dc) => {
    if (!tg) return;
    const currentKey = Object.keys(grid).find(k => grid[k]?.id === tg.id);
    if (!currentKey) return;
    const [r, c] = currentKey.split('-').map(Number);
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nc >= COLS) return;
    onMove(tg, nr, nc, r, c);
  };

  const totalRows = Math.max(rows, Math.ceil(tgList.length / COLS));

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan de la pharmacie</span>
        <p className="text-[10px] text-muted-foreground mt-0.5">Utilisez les flèches pour repositionner les TG</p>
      </div>

      <div className="p-3 space-y-2">
        {/* Légende colonnes */}
        <div className="flex gap-2 mb-1">
          <div className="flex-1 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Col. Gauche</div>
          <div className="flex-1 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Col. Droite</div>
        </div>

        {Array.from({ length: totalRows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2">
            {[0, 1].map(colIdx => {
              const tg = getTG(rowIdx, colIdx);
              if (!tg) {
                return (
                  <div key={colIdx} className="flex-1 min-h-[60px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-[10px] text-gray-300">vide</span>
                  </div>
                );
              }
              return (
                <div key={colIdx} className="flex-1 rounded-xl border-2 border-primary/30 bg-primary/5 p-2 min-h-[60px] relative">
                  <p className="text-[11px] font-bold text-primary truncate">{tg.nom}</p>
                  {tg.laboratoire && <p className="text-[9px] text-muted-foreground truncate">{tg.laboratoire}</p>}
                  
                  {/* Flèches de déplacement */}
                  <div className="absolute bottom-1 right-1 grid grid-cols-3 gap-0" style={{ gridTemplateAreas: '". up ." "left . right" ". down ."' }}>
                    <div />
                    <button
                      onClick={() => handleMove(tg, -1, 0)}
                      disabled={!canMove(tg, -1, 0)}
                      className="p-0.5 rounded hover:bg-primary/20 disabled:opacity-20 transition-colors"
                      style={{ gridArea: 'up' }}
                    >
                      <ChevronUp className="w-3 h-3 text-primary" />
                    </button>
                    <div />
                    <button
                      onClick={() => handleMove(tg, 0, -1)}
                      disabled={!canMove(tg, 0, -1)}
                      className="p-0.5 rounded hover:bg-primary/20 disabled:opacity-20 transition-colors"
                      style={{ gridArea: 'left' }}
                    >
                      <ChevronLeft className="w-3 h-3 text-primary" />
                    </button>
                    <div />
                    <button
                      onClick={() => handleMove(tg, 0, 1)}
                      disabled={!canMove(tg, 0, 1)}
                      className="p-0.5 rounded hover:bg-primary/20 disabled:opacity-20 transition-colors"
                      style={{ gridArea: 'right' }}
                    >
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </button>
                    <div />
                    <button
                      onClick={() => handleMove(tg, 1, 0)}
                      disabled={false}
                      className="p-0.5 rounded hover:bg-primary/20 transition-colors"
                      style={{ gridArea: 'down' }}
                    >
                      <ChevronDown className="w-3 h-3 text-primary" />
                    </button>
                    <div />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}