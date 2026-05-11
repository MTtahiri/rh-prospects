export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    return res.status(500).json({ error: 'Variables d\'environnement manquantes' });
  }

  const { statut } = req.query;

  let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres`;
  
  if (statut && statut.trim() !== '') {
    const filterByFormula = `{statut} = "${statut}"`;
    url += `?filterByFormula=${encodeURIComponent(filterByFormula)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur Airtable GET /Offres :", errorText);
      return res.status(response.status).json({ 
        error: 'Erreur Airtable', 
        details: errorText 
      });
    }

    const data = await response.json();

    const offres = (data.records || []).map(record => ({
      id: record.id,
      titre: record.fields.titre || 'Sans titre',
      entreprise: record.fields.entreprise || '',
      localisation: record.fields.localisation || '',
      type_contrat: record.fields.type_contrat || '',
      salaire: record.fields.salaire || '',
      description: record.fields.description || '',
      competences_requises: record.fields.competences_requises || '',
      statut: record.fields.statut || '',
      date_publication: record.fields.date_publication || '',
    }));

    return res.status(200).json(offres);

  } catch (error) {
    console.error("Exception GET /Offres :", error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
