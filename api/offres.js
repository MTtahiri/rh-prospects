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

  // ⚠️ Vérification des variables d'environnement
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  if (!BASE_ID || !TOKEN) {
    console.error('Variables manquantes:', { BASE_ID: !!BASE_ID, TOKEN: !!TOKEN });
    return res.status(500).json({ 
      error: 'Configuration serveur incomplète',
      missing: [!BASE_ID ? 'AIRTABLE_BASE_ID' : '', !TOKEN ? 'AIRTABLE_TOKEN' : ''].filter(Boolean)
    });
  }

  try {
    // Construction simple de l'URL SANS filtre pour tester
    const url = `https://api.airtable.com/v0/${BASE_ID}/Offres?maxRecords=20`;
    
    console.log('📡 Tentative appel Airtable...');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Airtable erreur ${response.status}:`, errorBody);
      return res.status(response.status).json({
        error: 'Erreur Airtable',
        status: response.status,
        body: errorBody.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log(`✅ ${data.records?.length || 0} offres chargées`);

    const offres = (data.records || []).map(record => ({
      id: record.id,
      titre: record.fields.titre || 'Poste sans titre',
      entreprise: record.fields.entreprise || 'Confidentiel',
      localisation: record.fields.localisation || 'Paris',
      type_contrat: record.fields.type_contrat || 'CDI',
      salaire: record.fields.salaire || 'Salaire à définir',
      description: record.fields.description || '',
      competences_requises: record.fields.competences_requises || '',
      date_publication: record.fields.date_publication || new Date().toISOString(),
    }));

    return res.status(200).json(offres); // ← Retourne directement le tableau
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
