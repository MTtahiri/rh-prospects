export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  const fields = {
    titre: req.body.titre,
    entreprise: req.body.entreprise,
    localisation: req.body.localisation,
    type_contrat: req.body.type_contrat,
    salaire: req.body.salaire,
    description: req.body.description,
    competences_requises: req.body.competences_requises,
    statut: "En attente",
    date_publication: new Date().toISOString(),
    "E-mail": req.body.email,
    nom_contact: req.body.nom_contact
  };

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Offres`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    if (!response.ok) throw new Error();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du dépôt de l\'offre' });
  }
}
