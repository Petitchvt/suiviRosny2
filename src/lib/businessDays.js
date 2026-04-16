/**
 * Compte les jours ouvrés (lun-sam) entre deux dates
 */
export function countBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    // 0 = dimanche, 1-6 = lun-sam
    if (day !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Ajoute N jours ouvrés à une date
 */
export function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0) {
      added++;
    }
  }

  return result;
}

/**
 * Soustrait N jours ouvrés d'une date
 */
export function subtractBusinessDays(date, days) {
  const result = new Date(date);
  let subtracted = 0;

  while (subtracted < days) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day !== 0) {
      subtracted++;
    }
  }

  return result;
}

/**
 * Filtre les ventes sur une période en jours ouvrés
 */
export function getBusinessDaysSales(ventes, startDate, endDate) {
  return ventes.filter(v => {
    const saleDate = new Date(v.date_vente);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const day = saleDate.getDay();
    // Inclure seulement lun-sam (jour !== 0)
    return saleDate >= start && saleDate <= end && day !== 0;
  });
}