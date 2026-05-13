export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const BASE  = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'Configuration serveur incomplète' });

  // ✅ competences : multipleSelects → array
  let competences;
  const rawComp = req.body.competences || '';
  if (rawComp) competences = rawComp.split(',').map(s => s.trim()).filter(Boolean);

  const fields = {
    prenom:        req.body.prenom        || undefined,
    nom:           req.body.nom           || undefined,
    email:         req.body.email         || undefined,
    telephone:     req.body.telephone     || undefined,
    titre:         req.body.titre         || undefined,
    localisation:  req.body.localisation  || undefined,
    experience:    req.body.experience    || undefined,  // singleLineText
    type_contrat:  req.body.type_contrat  || undefined,
    disponibilite: req.body.disponibilite || undefined,
    cv_url:        req.body.cv_url        || undefined,
    description:   req.body.description   || undefined,
    tjm:           req.body.tjm ? parseFloat(req.body.tjm) : undefined,
    // statut retiré → évite INVALID_MULTIPLE_CHOICE_OPTIONS
    date_creation: new Date().toISOString().slice(0, 10),
    ...(competences?.length ? { competences } : {}),
  };

  Object.keys(fields).forEach(k => {
    if (fields[k] === undefined || fields[k] === '' || fields[k] === null) delete fields[k];
  });

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/Postuler`, {
      method: 'POST',
      headers: { Authorization:`Bearer ${TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ records:[{ fields }], typecast: true })
    });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0,300) }; }
    if (!response.ok) return res.status(response.status).json({ error:'Erreur Airtable', details:data });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
