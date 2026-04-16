import React from 'react';
import { MapPin, FlaskConical } from 'lucide-react';

export default function TGGrid({ tgList, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tgList.map((tg) => (
        <button
          key={tg.id}
          onClick={() => onSelect(tg)}
          className="bg-card border border-border rounded-xl p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]"
        >
          <h3 className="font-semibold text-foreground text-sm truncate">{tg.nom}</h3>
          {tg.laboratoire && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <FlaskConical className="w-3 h-3" />
              <span className="truncate">{tg.laboratoire}</span>
            </div>
          )}
          {tg.emplacement && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{tg.emplacement}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}