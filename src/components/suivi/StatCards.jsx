import React from 'react';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

export default function StatCards({ productCount, totalVentes, totalCA }) {
  const stats = [
    { label: 'Produits', value: productCount, icon: Package, color: 'text-primary' },
    { label: 'Ventes 7j', value: totalVentes, icon: TrendingUp, color: 'text-nouveau' },
    { label: 'CA HT 7j', value: `${totalCA.toFixed(2)}€`, icon: DollarSign, color: 'text-alerte' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}