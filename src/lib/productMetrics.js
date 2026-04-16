import { subtractBusinessDays, addBusinessDays, getBusinessDaysSales } from './businessDays';

/**
 * Calcule l'évolution d'un produit
 * Retourne { evolution_percent, status, metric_type }
 */
export function calculateProductEvolution(product, ventes, metricType = 'ventes') {
  const entryDate = new Date(product.date_entree || product.created_date?.split('T')[0]);
  const today = new Date();

  // Période avant entrée : -14j ouvrés avant
  const periodBeforeStart = subtractBusinessDays(entryDate, 14);
  const periodBeforeEnd = new Date(entryDate);
  periodBeforeEnd.setDate(periodBeforeEnd.getDate() - 1);

  // Période après entrée : +14j ouvrés après
  const periodAfterStart = entryDate;
  const periodAfterEnd = addBusinessDays(entryDate, 14);

  // Récupérer les ventes
  const salesBefore = getBusinessDaysSales(ventes, periodBeforeStart, periodBeforeEnd);
  const salesAfter = getBusinessDaysSales(ventes, periodAfterStart, periodAfterEnd);

  // Calculer les totaux selon la métrique
  let beforeTotal = 0;
  let afterTotal = 0;

  if (metricType === 'ventes') {
    beforeTotal = salesBefore.reduce((sum, v) => sum + (v.quantite || 0), 0);
    afterTotal = salesAfter.reduce((sum, v) => sum + (v.quantite || 0), 0);
  } else if (metricType === 'ca') {
    beforeTotal = salesBefore.reduce((sum, v) => sum + Number(v.ca_ht || 0), 0);
    afterTotal = salesAfter.reduce((sum, v) => sum + Number(v.ca_ht || 0), 0);
  }

  // Calculer l'évolution en %
  const evolution = beforeTotal > 0 
    ? ((afterTotal - beforeTotal) / beforeTotal * 100)
    : null;

  // Déterminer le statut
  let status = 'MIDDLE';
  if (evolution !== null) {
    if (evolution >= 20) {
      status = 'TOP';
    } else if (evolution < 5) {
      status = 'FLOP';
    } else {
      status = 'MIDDLE';
    }
  }

  return {
    evolution_percent: evolution,
    status,
    metric_type: metricType
  };
}

/**
 * Groupe les produits par statut
 */
export function groupProductsByStatus(products) {
  return {
    TOP: products.filter(p => p.status === 'TOP'),
    MIDDLE: products.filter(p => p.status === 'MIDDLE'),
    FLOP: products.filter(p => p.status === 'FLOP')
  };
}