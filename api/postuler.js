export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error("Variables d'environnement manquantes");
    return res.status(500).json({ error: 'Configuration serveur incomplète (BASE_ID ou TOKEN)' });
  }

  const fields = {
    prenom:        req.body.prenom       || undefined,
    nom:           req.body.nom          || undefined,
    email:         req.body.email        || undefined,
    telephone:     req.body.telephone    || undefined,
    titre:         req.body.titre        || req.body.offreTitre || undefined,
    localisation:  req.body.localisation || undefined,

    // ✅ FIX : experience est singleLineText → pas de Number()
    experience:    req.body.experience   || undefined,

    type_contrat:  req.body.type_contrat  || undefined,
    disponibilite: req.body.disponibilite || undefined,
    cv_url:        req.body.cv_url        || undefined,
    competences:   req.body.competences   || undefined,

    // tjm est currency → Number() uniquement ici
    tjm: req.body.tjm ? Number(req.body.tjm) : undefined,

    description:   req.body.description  || undefined,
    statut:        'Nouveau',

    // ✅ FIX : YYYY-MM-DD (slice au lieu de toISOString complet)
    date_creation: new Date().toISOString().slice(0, 10)
  };

  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined || fields[key] === '') delete fields[key];
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Postuler`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Airtable :", data);
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Exception :", error);
    res.status(500).json({ error: error.message });
  }
}
