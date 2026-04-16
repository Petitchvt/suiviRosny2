import React from 'react';

// Plan de la pharmacie basé sur la photo
// Deux colonnes : Droite (D) et Centre (C), plus TG-00 en haut et 1212D en bas
// Layout : CAISSE en haut à droite, COMPTOIR en bas à droite

const TG_LAYOUT = [
  // Rangée 0 : TG-000 seul
  [{ id: 'TG-000', col: 0 }, null],
  // Rangée 1 : TG-00 seul
  [{ id: 'TG-00', col: 0 }, null],
  // Rangée 2 : TG-12D + Caisse rapide
  [{ id: 'TG-12D', col: 0 }, 'caisse'],
  [{ id: 'TG-23D', col: 0 }, { id: 'TG-23C', col: 1 }],
  [{ id: 'TG-34D', col: 0 }, { id: 'TG-34C', col: 1 }],
  [{ id: 'TG-45D', col: 0 }, { id: 'TG-45C', col: 1 }],
  [{ id: 'TG-56D', col: 0 }, { id: 'TG-56C', col: 1 }],
  [{ id: 'TG-67D', col: 0 }, { id: 'TG-67C', col: 1 }],
  [{ id: 'TG-78D', col: 0 }, { id: 'TG-78C', col: 1 }],
  [{ id: 'TG-89D', col: 0 }, { id: 'TG-89C', col: 1 }],
  [{ id: 'TG-910D', col: 0 }, { id: 'TG-910C', col: 1 }],
  [{ id: 'TG-1011D', col: 0 }, { id: 'TG-1011C', col: 1 }],
  [{ id: 'TG-1112D', col: 0 }, { id: 'TG-1112C', col: 1 }],
  // Dernière rangée : 1212D seul
  [{ id: 'TG-1212D', col: 0 }, null],
];

export const ALL_TGS = TG_LAYOUT.flatMap(row => row.filter(Boolean)).map(t => t.id);

export default function PharmacyMap({ tgData, onSelect }) {
  // tgData: { [nom]: { count, hasNew } }

  const TGBox = ({ tg }) => {
    if (!tg) return <div className="flex-1" />;
    const info = tgData?.[tg.id] || {};
    const color = info.color || 'default';
    const label = tg.id.replace('TG-', '');

    const colorClass = color === 'green'
      ? 'border-green-400 bg-green-100 text-green-800'
      : color === 'red'
      ? 'border-red-400 bg-red-100 text-red-800'
      : color === 'gray'
      ? 'border-gray-300 bg-gray-100 text-gray-700'
      : 'border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/5';

    return (
      <button
        onClick={() => onSelect(tg.id)}
        className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 py-2 px-1 transition-all active:scale-95 min-h-[52px] ${colorClass}`}
      >
        <span className="text-[11px] font-bold leading-tight">{label}</span>
        {info.count > 0 && info.ca > 0 && (
          <span className="text-[9px] mt-0.5 font-bold italic">{info.ca.toFixed(0)}€</span>
        )}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Pharmacie</span>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-200 border border-green-400 inline-block" />≥60% TOP</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-200 border border-red-400 inline-block" />≥60% FLOP</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 border border-gray-300 inline-block" />Mixte</span>
        </div>
      </div>

      {/* Map body */}
      <div className="p-3">
        <div className="space-y-1.5">
          {TG_LAYOUT.map((row, rowIdx) => {
            const isLast = rowIdx === TG_LAYOUT.length - 1;
            const right = row[1];

            return (
              <div key={rowIdx} className="flex gap-2">
                <TGBox tg={row[0]} />
                {right === 'caisse' ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-2 px-1 min-h-[52px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center leading-tight">Caisse<br/>rapide</span>
                  </div>
                ) : isLast ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-2 px-1 min-h-[52px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center leading-tight">Comptoir</span>
                  </div>
                ) : right !== undefined && right !== null ? (
                  <TGBox tg={right} />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}