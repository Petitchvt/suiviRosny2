import React from 'react';

export default function TGProgressBar({ tg, products }) {
  const tgProducts = products.filter(p => p.tg_id === tg.id && p.actif);
  
  if (tgProducts.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{tg.nom}</span>
        <div className="flex-1 h-2 bg-secondary rounded-full" />
      </div>
    );
  }

  const topCount = tgProducts.filter(p => p.status === 'TOP').length;
  const middleCount = tgProducts.filter(p => p.status === 'MIDDLE').length;
  const flopCount = tgProducts.filter(p => p.status === 'FLOP').length;
  const total = tgProducts.length;

  const topPercent = (topCount / total) * 100;
  const middlePercent = (middleCount / total) * 100;
  const flopPercent = (flopCount / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{tg.nom}</span>
        <span className="text-[10px] text-muted-foreground">{total} prod.</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden border border-border">
        {topPercent > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${topPercent}%` }}
            title={`${topCount} TOP`}
          />
        )}
        {middlePercent > 0 && (
          <div
            className="bg-gray-400"
            style={{ width: `${middlePercent}%` }}
            title={`${middleCount} MIDDLE`}
          />
        )}
        {flopPercent > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${flopPercent}%` }}
            title={`${flopCount} FLOP`}
          />
        )}
        {total === 0 && <div className="w-full bg-secondary" />}
      </div>
      <div className="flex gap-2 text-[9px] text-muted-foreground">
        {topCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> {topCount}</span>}
        {middleCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full" /> {middleCount}</span>}
        {flopCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> {flopCount}</span>}
      </div>
    </div>
  );
}