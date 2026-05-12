export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN)
    return res.status(500).json({ error: 'Configuration serveur incomplète (BASE_ID ou TOKEN)' });

  const today = new Date().toISOString().slice(0, 10);

  // ── Table Offres ──────────────────────────────
  const offreFields = {
    titre: req.body.titre || undefined,
    entreprise: req.body.entreprise || undefined,
    localisation: req.body.localisation || undefined,
    type_contrat: req.body.type_contrat || undefined,
    salaire: req.body.salaire || undefined,
    description: req.body.description || undefined,
    competences_requises: req.body.competences_requises || undefined,
    statut: 'En attente',
    date_publication: today,
    'E-mail': req.body.email || undefined,
    Partenaire: req.body.entreprise || undefined,
  };
  Object.keys(offreFields).forEach(k => { if (!offreFields[k]) delete offreFields[k]; });

  // ── Table Recruteurs ──────────────────────────
  const fullName  = (req.body.nom_contact || '').trim();
  const parts     = fullName.split(' ');
  const prenomC   = parts.length > 1 ? parts.slice(0,-1).join(' ') : fullName;
  const nomC      = parts.length > 1 ? parts[parts.length-1] : '';

  const recruteurFields = {
    entreprise:       req.body.entreprise || undefined,
    email:            req.body.email      || undefined,
    nom_contact:      nomC || fullName    || undefined,
    prenom_contact:   prenomC             || undefined,
    telephone:        req.body.telephone  || undefined,
    statut:           'En attente',
    date_inscription: today,
  };
  Object.keys(recruteurFields).forEach(k => { if (!recruteurFields[k]) delete recruteurFields[k]; });

  try {
    const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };
    const base    = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

    const [r1, r2] = await Promise.all([
      fetch(`${base}/Offres`,     { method:'POST', headers, body: JSON.stringify({ records:[{ fields: offreFields }] }) }),
      fetch(`${base}/Recruteurs`, { method:'POST', headers, body: JSON.stringify({ records:[{ fields: recruteurFields }] }) })
    ]);

    const d1 = await r1.json();
    if (!r1.ok) return res.status(r1.status).json({ error: 'Erreur table Offres', details: d1 });

    const d2 = await r2.json();
    if (!r2.ok) console.warn('Recruteur non créé:', d2); // non bloquant

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
