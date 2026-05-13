export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Configuration serveur incomplète' });
  }

  // Statut normalisé — valeurs valides : En attente | Validé | Refusé
  const statutRaw = (req.body.statut || '').toLowerCase();
  const statutMap = {
    'en attente': 'En attente',
    'attente':    'En attente',
    'valide':     'Validé',
    'validé':     'Validé',
    'refuse':     'Refusé',
    'refusé':     'Refusé',
  };
  const statut = statutMap[statutRaw] || 'En attente';

  const fields = {
    entreprise:        req.body.entreprise         || undefined,
    siret:             req.body.siret              || undefined,
    nom_contact:       req.body.nom_contact        || req.body.nom || undefined,
    prenom_contact:    req.body.prenom_contact     || req.body.prenom || undefined,
    email:             req.body.email              || undefined,
    telephone:         req.body.telephone          || undefined,
    titre_du_poste:    req.body.titre_du_poste     || undefined,
    localisation:      req.body.localisation       || undefined,
    type_de_contrat:   req.body.type_de_contrat    || undefined,
    salaire:           req.body.salaire            ? Number(req.body.salaire) : undefined,
    statut:            statut,
    date_inscription:  new Date().toISOString().slice(0, 10),
    // ❌ "competences" omis volontairement — champ multilineText, pas envoyé ici
  };

  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined || fields[key] === '') delete fields[key];
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Recruteurs`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ fields }],
        typecast: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur Airtable Recruteurs :', JSON.stringify(data, null, 2));
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    return res.status(200).json({ success: true, id: data.records?.[0]?.id });
  } catch (error) {
    console.error('Exception recruteurs:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
