import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, FlaskConical, User } from 'lucide-react';
import { ACHETEURS, getAcheteurDuLabo } from '@/lib/acheteurs';
import LaboDetailModal from '@/components/labo/LaboDetailModal';

const MOIS_ORDER = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function Accueil() {
  const [query, setQuery] = useState('');
  const [selectedLabo, setSelectedLabo] = useState(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMois = MOIS_ORDER[now.getMonth()];

  const normalizeMois = (m) => m ? m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

  const { data: entries = [] } = useQuery({
    queryKey: ['ventescomparatif'],
    queryFn: () => base44.entities.VentesComparatif.list('-created_date', 10000),
  });

  // Laboratoires uniques présents en base
  const labosEnBase = useMemo(() => {
    return [...new Set(entries.map(e => e.laboratoire))].sort();
  }, [entries]);

  // Résultats de recherche
  const resultats = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toUpperCase();
    return labosEnBase.filter(labo => labo.toUpperCase().includes(q)).slice(0, 15);
  }, [query, labosEnBase]);

  // CA du mois courant pour un labo
  const getCAMois = (labo) => {
    const filtered = entries.filter(e =>
      e.laboratoire === labo && String(parseInt(e.annee)) === String(currentYear) && normalizeMois(e.mois) === normalizeMois(currentMois)
    );
    return filtered.reduce((s, e) => s + (e.ca_ht_n || 0), 0);
  };

  const acheteurLinks = [
    { id: 'riad', label: 'Riad', path: '/laboratoires/riad', couleur: '#f97316' },
    { id: 'cedric', label: 'Cédric', path: '/laboratoires/cedric', couleur: '#22c55e' },
    { id: 'jadujan', label: 'Jadujan', path: '/laboratoires/jadujan', couleur: '#94a3b8' },
    { id: 'rapher', label: 'Rapher / Youssef', path: '/laboratoires/rapher', couleur: '#eab308' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 50%, #f5f7fa 100%)" }}>
      <div className="relative max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(96,165,250,0.4))", border: "1px solid rgba(255,255,255,0.8)" }}>
            <FlaskConical className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Suivi Laboratoires</h1>
          <p className="text-slate-500">Recherchez un laboratoire ou accédez à la page d'un acheteur</p>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <div className="rounded-2xl overflow-hidden shadow-lg"
            style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.9)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center px-5 py-4 gap-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un laboratoire..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-lg bg-transparent outline-none text-slate-700 placeholder-slate-400"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
              )}
            </div>
          </div>

          {/* Résultats */}
          {resultats.length > 0 && (
            <div className="absolute w-full mt-2 rounded-2xl overflow-hidden shadow-xl z-10"
              style={{ background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(255,255,255,0.9)", backdropFilter: "blur(20px)" }}>
              {resultats.map(labo => {
                const acheteur = getAcheteurDuLabo(labo);
                const ca = getCAMois(labo);
                return (
                  <button key={labo} onClick={() => { setSelectedLabo(labo); setQuery(''); }}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-violet-50 transition-colors border-b border-white/50 last:border-0 text-left cursor-pointer">
                    <div className="flex items-center gap-3">
                      {acheteur && (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: acheteur.couleur }} />
                      )}
                      <div>
                        <p className="font-medium text-slate-700">{labo}</p>
                        {acheteur && (
                          <p className="text-xs text-slate-400">{acheteur.nom}</p>
                        )}
                      </div>
                    </div>
                    {ca > 0 && (
                      <span className="text-sm font-mono text-slate-600">
                        {ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {query && resultats.length === 0 && (
            <div className="absolute w-full mt-2 rounded-2xl px-5 py-4 text-slate-400 text-sm text-center z-10"
              style={{ background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(255,255,255,0.9)" }}>
              Aucun laboratoire trouvé pour "{query}"
            </div>
          )}
        </div>

        {/* Cards acheteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          {acheteurLinks.map(a => (
            <Link key={a.id} to={a.path}
              className="rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.8)", backdropFilter: "blur(16px)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                style={{ background: `${a.couleur}22`, border: `2px solid ${a.couleur}44` }}>
                <User className="w-6 h-6" style={{ color: a.couleur }} />
              </div>
              <span className="font-semibold text-slate-700 text-center text-sm leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Lien vers le suivi global */}
        <div className="mt-8 text-center">
          <Link to="/laboratoires/suivi" className="text-sm text-slate-400 hover:text-violet-600 transition-colors underline underline-offset-4">
            Voir le suivi global →
          </Link>
        </div>
      </div>

      {selectedLabo && (
        <LaboDetailModal
          labo={selectedLabo}
          entries={entries}
          currentYear={currentYear}
          onClose={() => setSelectedLabo(null)}
          allLabos={labosEnBase}
          onNavigate={setSelectedLabo}
        />
      )}
    </div>
  );
}
