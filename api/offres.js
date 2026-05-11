export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID manquant' });
  }

  // Note : la table s'appelle "Offres" (avec un S) dans Airtable
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres/${id}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    const record = await response.json();
    const offre = {
      id: record.id,
      titre: record.fields.titre,
      entreprise: record.fields.entreprise,
      localisation: record.fields.localisation,
      type_contrat: record.fields.type_contrat,
      salaire: record.fields.salaire,
      description: record.fields.description,
      competences_requises: record.fields.competences_requises
    };

    res.status(200).json(offre);
  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
