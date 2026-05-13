export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  if (!BASE_ID || !TOKEN) {
    console.error('Variables manquantes');
    return res.status(500).json({ error: 'Configuration Airtable manquante' });
  }

  try {
    // Appel Airtable sans filtre pour tout récupérer
    const url = `https://api.airtable.com/v0/${BASE_ID}/Offres?maxRecords=50`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Airtable:', response.status, errorText);
      return res.status(response.status).json({ error: 'Erreur Airtable' });
    }

    const data = await response.json();
    
    // Transformer les données Airtable en tableau simple
    const offres = (data.records || []).map(record => ({
      id: record.id,
      titre: record.fields.titre || 'Sans titre',
      entreprise: record.fields.entreprise || 'Entreprise non spécifiée',
      localisation: record.fields.localisation || 'Paris',
      type_contrat: record.fields.type_contrat || 'CDI',
      salaire: record.fields.salaire || 'Salaire à définir',
      description: record.fields.description || '',
      competences_requises: record.fields.competences_requises || '',
      date_publication: record.fields.date_publication || new Date().toISOString().split('T')[0],
    }));

    // ✅ CRUCIAL : Retourne UNIQUEMENT le tableau, pas un objet
    return res.status(200).json(offres);
    
  } catch (error) {
    console.error('Exception:', error.message);
    return res.status(500).json([]); // Retourne tableau vide en erreur
  }
}
