export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const BASE  = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'Configuration Airtable manquante' });

  // ✅ Cache CDN 10 min + stale 30 min → max ~6 appels Airtable/heure
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');

  const filter = encodeURIComponent('NOT({statut}="Refusé")');
  const fields = ['titre','entreprise','localisation','type_contrat','salaire',
                  'description','competences_requises','statut','date_publication']
                 .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  const url = `https://api.airtable.com/v0/${BASE}/Offres?filterByFormula=${filter}&${fields}&sort[0][field]=date_publication&sort[0][direction]=desc&pageSize=100`;

  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const text = await response.text();

    let data;
    try { data = JSON.parse(text); }
    catch {
      console.error('Non-JSON from Airtable:', text.slice(0,200));
      return res.status(502).json({ error: 'Réponse Airtable invalide' });
    }

    if (!response.ok) {
      // Billing limit → retourner tableau vide avec message clair
      const isLimit = JSON.stringify(data).includes('BILLING_LIMIT');
      if (isLimit) {
        console.warn('Airtable billing limit atteinte');
        return res.status(200).json([]); // vide mais pas d'erreur JS côté client
      }
      return res.status(response.status).json({ error:'Erreur Airtable', details:data });
    }

    return res.status(200).json((data.records || []).map(r => ({
      id:                   r.id,
      titre:                r.fields.titre                || 'Sans titre',
      entreprise:           r.fields.entreprise           || 'Confidentiel',
      localisation:         r.fields.localisation         || 'France',
      type_contrat:         r.fields.type_contrat         || '',
      salaire:              r.fields.salaire              || '',
      description:          r.fields.description          || '',
      competences_requises: r.fields.competences_requises || '',
      statut:               r.fields.statut               || '',
      date_publication:     r.fields.date_publication     || '',
    })));
  } catch (err) {
    console.error('Exception /api/offres:', err.message);
    return res.status(500).json([]);
  }
}
