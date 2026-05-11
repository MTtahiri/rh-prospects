export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  
  const { nom, email, type, message } = req.body;
  
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contacts`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Nom: nom,
            Email: email,
            Type: type,
            Message: message,
            Date: new Date().toISOString()
          }
        }]
      })
    });
    
    if (!response.ok) throw new Error();
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur envoi' });
  }
}