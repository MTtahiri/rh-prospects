export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET seulement' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Configuration serveur incomplète' });
  }

  // Filtre : offres actives uniquement (En attente OU Validé)
  const filter = encodeURIComponent('OR({statut}="En attente",{statut}="Validé")');

  // Champs à récupérer
  const fieldsParam = [
    'titre', 'entreprise', 'localisation',
    'type_contrat', 'salaire', 'description',
    'competences_requises', 'statut', 'date_publication'
  ].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const sort = 'sort[0][field]=date_publication&sort[0][direction]=desc';
  const url  = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres?filterByFormula=${filter}&${fieldsParam}&${sort}&pageSize=100`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    const data = await response.json();

    if (!response.ok) {
      console.error('Airtable /Offres error:', data);
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    // Cache 5 minutes côté Vercel CDN
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    const records = (data.records || []).map(r => ({
      id:                   r.id,
      titre:                r.fields.titre                || '',
      entreprise:           r.fields.entreprise           || '',
      localisation:         r.fields.localisation         || '',
      type_contrat:         r.fields.type_contrat         || '',
      salaire:              r.fields.salaire              || '',
      description:          r.fields.description          || '',
      competences_requises: r.fields.competences_requises || '',
      statut:               r.fields.statut               || '',
      date_publication:     r.fields.date_publication     || '',
    }));

    res.status(200).json(records);
  } catch (err) {
    console.error('Exception /api/offres:', err);
    res.status(500).json({ error: err.message });
  }
}
