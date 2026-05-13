export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const BASE = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'Configuration serveur incomplète' });

  const today = new Date().toISOString().slice(0, 10);
  const h = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  const api = `https://api.airtable.com/v0/${BASE}`;

  // ── Table Offres ─────────────────────────────
  const offreFields = {
    titre:                req.body.titre        || undefined,
    entreprise:           req.body.entreprise   || undefined,
    localisation:         req.body.localisation || undefined,
    type_contrat:         req.body.type_contrat || undefined,
    salaire:              req.body.salaire       || undefined,
    description:          req.body.description  || undefined,
    competences_requises: req.body.competences_requises || undefined,
    statut:               'Ouverte',   // ✅ valeur réelle dans Airtable (pas "En attente")
    date_publication:     today,
    'E-mail':             req.body.email      || undefined,
    Partenaire:           req.body.entreprise || undefined,
  };
  Object.keys(offreFields).forEach(k => { if (!offreFields[k]) delete offreFields[k]; });

  // ── Table Recruteurs ─────────────────────────
  const fullName = (req.body.nom_contact || '').trim();
  const parts    = fullName.split(' ');
  const recruteurFields = {
    entreprise:       req.body.entreprise   || undefined,
    email:            req.body.email        || undefined,
    nom_contact:      parts.length > 1 ? parts[parts.length-1] : fullName || undefined,
    prenom_contact:   parts.length > 1 ? parts.slice(0,-1).join(' ')  : undefined,
    telephone:        req.body.telephone    || undefined,
    // statut retiré → évite INVALID_MULTIPLE_CHOICE_OPTIONS
    date_inscription: today,
  };
  Object.keys(recruteurFields).forEach(k => { if (!recruteurFields[k]) delete recruteurFields[k]; });

  try {
    const [r1, r2] = await Promise.all([
      fetch(`${api}/Offres`,     { method:'POST', headers:h, body:JSON.stringify({ records:[{ fields:offreFields }] }) }),
      fetch(`${api}/Recruteurs`, { method:'POST', headers:h, body:JSON.stringify({ records:[{ fields:recruteurFields }] }) })
    ]);

    const text1 = await r1.text();
    let d1; try { d1 = JSON.parse(text1); } catch { d1 = { raw: text1.slice(0,200) }; }
    if (!r1.ok) return res.status(r1.status).json({ error: 'Erreur Offres', details: d1 });

    const text2 = await r2.text();
    let d2; try { d2 = JSON.parse(text2); } catch { d2 = {}; }
    if (!r2.ok) console.warn('Recruteur non enregistré :', d2); // non bloquant

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
