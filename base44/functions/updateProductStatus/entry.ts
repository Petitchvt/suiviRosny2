import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Calcule et met à jour le statut d'un produit basé sur l'évolution
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, metric_type = 'ventes' } = await req.json();

    if (!product_id) {
      return Response.json({ error: 'product_id required' }, { status: 400 });
    }

    // Récupérer le produit
    const product = await base44.entities.ProduitTG.get(product_id);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Récupérer les ventes du produit
    const ventes = await base44.entities.VentesTG.filter({
      ean: product.ean,
      tg_id: product.tg_id
    });

    const entryDate = new Date(product.date_entree || product.created_date?.split('T')[0]);

    // Calculer les jours ouvrés avant et après
    function countBusinessDays(start, end) {
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0) count++;
        current.setDate(current.getDate() + 1);
      }
      return count;
    }

    function addBusinessDays(date, days) {
      const result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0) added++;
      }
      return result;
    }

    function subtractBusinessDays(date, days) {
      const result = new Date(date);
      let subtracted = 0;
      while (subtracted < days) {
        result.setDate(result.getDate() - 1);
        const day = result.getDay();
        if (day !== 0) subtracted++;
      }
      return result;
    }

    // Période avant : -14j ouvrés
    const periodBeforeStart = subtractBusinessDays(entryDate, 14);
    const periodBeforeEnd = new Date(entryDate);
    periodBeforeEnd.setDate(periodBeforeEnd.getDate() - 1);

    // Période après : +14j ouvrés
    const periodAfterStart = entryDate;
    const periodAfterEnd = addBusinessDays(entryDate, 14);

    // Filtrer les ventes
    const salesBefore = ventes.filter(v => {
      const d = new Date(v.date_vente);
      const day = d.getDay();
      return d >= periodBeforeStart && d <= periodBeforeEnd && day !== 0;
    });

    const salesAfter = ventes.filter(v => {
      const d = new Date(v.date_vente);
      const day = d.getDay();
      return d >= periodAfterStart && d <= periodAfterEnd && day !== 0;
    });

    // Calculer les totaux
    let beforeTotal = 0;
    let afterTotal = 0;

    if (metric_type === 'ventes') {
      beforeTotal = salesBefore.reduce((sum, v) => sum + (v.quantite || 0), 0);
      afterTotal = salesAfter.reduce((sum, v) => sum + (v.quantite || 0), 0);
    } else {
      beforeTotal = salesBefore.reduce((sum, v) => sum + Number(v.ca_ht || 0), 0);
      afterTotal = salesAfter.reduce((sum, v) => sum + Number(v.ca_ht || 0), 0);
    }

    // Calculer l'évolution
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
      }
    }

    // Mettre à jour le produit
    await base44.entities.ProduitTG.update(product_id, {
      status,
      evolution_percent: evolution,
      metric_type,
      cycle_start_date: new Date().toISOString().split('T')[0]
    });

    return Response.json({
      status,
      evolution_percent: evolution,
      metric_type
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});