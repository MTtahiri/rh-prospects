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

  // ✅ FIX : noms de colonnes exacts de la table Contacts Airtable
  //   nom | email | telephone | company | sujet | message | source | date_contact
  //
  // Valeurs valides pour sujet  : recrutement | portage | candidature | partenariat | autre
  // Valeurs valides pour source : page_contact | page_accueil

  // Normaliser le sujet : le frontend peut envoyer "Candidat"/"Recruteur" (ancienne forme)
  // → on les mappe vers les valeurs Airtable attendues
  const sujetRaw = req.body.sujet || req.body.type || '';
  const sujetMap = {
    'candidat':     'candidature',
    'candidature':  'candidature',
    'recruteur':    'recrutement',
    'recrutement':  'recrutement',
    'portage':      'portage',
    'partenariat':  'partenariat',
    'autre':        'autre',
  };
  const sujet = sujetMap[sujetRaw.toLowerCase()] || 'autre';

  // Normaliser la source
  const sourceRaw = req.body.source || '';
  const sourceMap = {
    'page_contact':  'page_contact',
    'page_accueil':  'page_accueil',
    'contact':       'page_contact',
    'accueil':       'page_accueil',
    'site web':      'page_accueil',
  };
  const source = sourceMap[sourceRaw.toLowerCase()] || 'page_accueil';

  const fields = {
    // ✅ FIX : minuscules, noms exacts de la table
    nom:          req.body.nom     || undefined,
    email:        req.body.email   || undefined,
    telephone:    req.body.telephone || undefined,
    company:      req.body.company   || undefined,
    sujet:        sujet,
    message:      req.body.message || undefined,
    source:       source,

    // ✅ FIX : format YYYY-MM-DD (l'ancien code envoyait toISOString() et le mauvais champ "Date")
    date_contact: new Date().toISOString().slice(0, 10)
  };

  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined || fields[key] === '') delete fields[key];
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`;

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
      console.error("Erreur Airtable Contacts :", data);
      return res.status(response.status).json({ error: 'Erreur Airtable', details: data });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Exception contact:", error);
    res.status(500).json({ error: error.message });
  }
}
