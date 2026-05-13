export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const BASE  = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'Configuration serveur incomplète' });

  const sujetMap = {
    candidat:'candidature', candidature:'candidature',
    recruteur:'recrutement', recrutement:'recrutement',
    portage:'portage', partenariat:'partenariat', autre:'autre',
  };
  const sujet  = sujetMap[(req.body.sujet||'').toLowerCase()] || 'autre';
  const source = ['page_contact','page_accueil'].includes(req.body.source)
                 ? req.body.source : 'page_accueil';

  const fields = {
    nom:          req.body.nom      || undefined,
    email:        req.body.email    || undefined,
    telephone:    req.body.telephone || undefined,
    company:      req.body.company   || undefined,
    sujet,
    message:      req.body.message  || undefined,
    source,
    date_contact: new Date().toISOString().slice(0, 10),
  };
  Object.keys(fields).forEach(k => { if (!fields[k]) delete fields[k]; });

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/Contacts`, {
      method: 'POST',
      headers: { Authorization:`Bearer ${TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ records:[{ fields }] })
    });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = {}; }
    if (!response.ok) return res.status(response.status).json({ error:'Erreur Airtable', details:data });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
