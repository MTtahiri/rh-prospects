export default async function handler(req, res) {
  // CORS (conservé de la version originale)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const BASE  = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'Configuration Airtable manquante' });

  // ✅ Cache CDN 5 min → évite le rate-limit Airtable 429
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  // Exclure uniquement les offres explicitement refusées
  const filter = encodeURIComponent('NOT({statut}="Refusé")');
  const fields = [
    'titre','entreprise','localisation','type_contrat',
    'salaire','description','competences_requises','statut','date_publication'
  ].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const url = `https://api.airtable.com/v0/${BASE}/Offres?filterByFormula=${filter}&${fields}&sort[0][field]=date_publication&sort[0][direction]=desc&pageSize=100`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    // ✅ Lire le texte d'abord — évite "Unexpected token" si retour HTML
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Airtable réponse non-JSON :', text.slice(0, 200));
      return res.status(502).json({ error: 'Réponse Airtable invalide' });
    }

    if (!response.ok) {
      console.error('Erreur Airtable:', response.status, data);
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    const offres = (data.records || []).map(r => ({
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
    }));

    return res.status(200).json(offres);
  } catch (err) {
    console.error('Exception /api/offres:', err.message);
    return res.status(500).json([]);
  }
}
