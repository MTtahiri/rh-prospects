export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Variables d\'environnement manquantes' });
  }

  const params = new URLSearchParams({
    filterByFormula: "{statut}='Ouverte'",
    'sort[0][field]':     'date_publication',
    'sort[0][direction]': 'desc'
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres?${params}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur Airtable GET Offres:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    const offres = (data.records || []).map(r => ({
      id:                   r.id,
      titre:                r.fields.titre                || '',
      entreprise:           r.fields.entreprise           || 'Confidentiel',
      localisation:         r.fields.localisation         || '',
      type_contrat:         r.fields.type_contrat         || '',
      salaire:              r.fields.salaire              || '',
      description:          r.fields.description          || '',
      competences_requises: r.fields.competences_requises || '',
      statut:               r.fields.statut               || '',
      date_publication:     r.fields.date_publication     || '',
    }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ success: true, offres });

  } catch (error) {
    console.error('Exception offres:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
