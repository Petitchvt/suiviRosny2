import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DailyView({ ventes }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayVentes = ventes.filter((v) => v.date_vente === dateStr);
    const quantite = dayVentes.reduce((s, v) => s + (v.quantite || 0), 0);
    const ca = dayVentes.reduce((s, v) => s + Number(v.ca_ht || 0), 0);
    return {
      jour: format(date, 'EEE dd', { locale: fr }),
      quantite,
      ca: Math.round(ca * 100) / 100,
    };
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium">CA HT par jour (€)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 16%)" />
              <XAxis dataKey="jour" tick={{ fill: 'hsl(240 10% 55%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(240 10% 55%)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid hsl(240 20% 16%)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="ca" fill="#6c63ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-1.5">
        {days.map((d) => (
          <div key={d.jour} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
            <span className="text-sm text-foreground font-medium">{d.jour}</span>
            <div className="flex gap-4 text-xs">
              <span className="text-muted-foreground">{d.quantite} unités</span>
              <span className="text-foreground font-semibold">{d.ca.toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}