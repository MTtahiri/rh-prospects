import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const records = await base('offres')
      .select({
        sort: [{ field: 'date_publication', direction: 'desc' }],
        maxRecords: 50
      })
      .all();

    const offres = records.map(record => ({
      id: record.id,
      titre: record.fields.titre || 'Sans titre',
      type_contrat: record.fields.type_contrat || 'CDI',
      localisation: record.fields.localisation || 'Paris',
      entreprise: record.fields.entreprise || '',
      salaire: record.fields.salaire || 'Salaire à définir',
      description: record.fields.description || '',
      competences_requises: record.fields.competences_requises || '',
      date_publication: record.fields.date_publication || new Date().toISOString(),
      actif: record.fields.actif !== false
    }));

    // ✅ Ne garder que les offres actives
    const offresActives = offres.filter(o => o.actif === true || o.actif === undefined);

    return res.status(200).json(offresActives);
  } catch (error) {
    console.error('❌ Erreur Airtable:', error.message);
    return res.status(500).json({ 
      error: 'Erreur lors du chargement des offres',
      details: error.message 
    });
  }
}
