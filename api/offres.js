export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  
  const { statut } = req.query;
  
  let filterByFormula = '';
  if (statut === 'Ouverte') {
    filterByFormula = `{statut} = "Ouverte"`;
  }
  
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres?${filterByFormula ? `filterByFormula=${encodeURIComponent(filterByFormula)}` : ''}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    const offres = data.records.map(record => ({
      id: record.id,
      titre: record.fields.titre,
      entreprise: record.fields.entreprise,
      localisation: record.fields.localisation,
      type_contrat: record.fields.type_contrat,
      salaire: record.fields.salaire,
      description: record.fields.description,
      competences_requises: record.fields.competences_requises,
      statut: record.fields.statut
    }));
    
    res.status(200).json(offres);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement offres' });
  }
}