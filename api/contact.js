// api/contact.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { nom, email, sujet, message, source } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email et message obligatoires' });
  }

  // Mapping sujet → valeur singleSelect Airtable
  const sujetMap = {
    'candidat':   'candidature',
    'recruteur':  'recrutement',
  };
  const sujetAirtable = sujetMap[sujet] || 'autre';

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              Nom:     nom     || '',
              Email:   email,
              Sujet:   sujetAirtable,
              Message: message,
              Source:  source  || 'page_accueil',
            }
          }],
          typecast: true   // ← CORRECTION CLEF : évite les erreurs sur les singleSelect
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Airtable error', details: data });
    }

    return res.status(200).json({ success: true, id: data.records?.[0]?.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
