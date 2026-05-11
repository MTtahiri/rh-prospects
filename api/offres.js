export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  const { statut } = req.query;

  // Construction du filtre Airtable
  let filterByFormula = '';
  if (statut && statut !== '') {
    // Le format correct pour Airtable : {statut} = "Ouverte"
    filterByFormula = `{statut} = "${statut}"`;
  }

  let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres`;
  if (filterByFormula) {
    url += `?filterByFormula=${encodeURIComponent(filterByFormula)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur Airtable :", errorText);
      return res.status(response.status).json({ 
        error: 'Erreur Airtable', 
        details: errorText 
      });
    }

    const data = await response.json();

    const offres = data.records.map(record => ({
      id: record.id,
      titre: record.fields.titre || 'Sans titre',
      entreprise: record.fields.entreprise || '',
      localisation: record.fields.localisation || '',
      type_contrat: record.fields.type_contrat || '',
      salaire: record.fields.salaire || '',
      description: record.fields.description || '',
      competences_requises: record.fields.competences_requises || '',
      statut: record.fields.statut || ''
    }));

    res.status(200).json(offres);
  } catch (error) {
    console.error("Exception :", error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
