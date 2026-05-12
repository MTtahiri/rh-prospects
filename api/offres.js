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
    titre:                req.body.titre                || undefined,
    entreprise:           req.body.entreprise           || undefined,
    localisation:         req.body.localisation         || undefined,
    type_contrat:         req.body.type_contrat         || undefined,
    salaire:              req.body.salaire              || undefined,
    description:          req.body.description          || undefined,
    competences_requises: req.body.competences_requises || undefined,
    statut:               'En attente',

    // ✅ FIX : Airtable date attend YYYY-MM-DD, pas toISOString() complet
    date_publication: new Date().toISOString().slice(0, 10),

    // ✅ Champs exacts de la table Offres (nom_contact n'existe pas dans Offres)
    'E-mail':   req.body.email      || undefined,
    Partenaire: req.body.entreprise || undefined
  };

  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined || fields[key] === '') delete fields[key];
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres`;

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
