export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error("Variables d'environnement manquantes");
    return res.status(500).json({ error: 'Configuration serveur incomplète (BASE_ID ou TOKEN)' });
  }

  // Définir explicitement les champs autorisés, avec date au bon format
  const fields = {
    prenom: req.body.prenom || "",
    nom: req.body.nom || "",
    email: req.body.email || "",
    telephone: req.body.telephone || "",
    titre: req.body.titre || req.body.offreTitre || "",
    localisation: req.body.localisation || "",
    experience: req.body.experience ? Number(req.body.experience) : undefined,
    type_contrat: req.body.type_contrat || "",
    disponibilite: req.body.disponibilite || "",
    cv_url: req.body.cv_url || "",
    description: req.body.description || "",
    statut: "Nouveau",
    date_creation: new Date().toLocaleDateString('fr-CA') // format YYYY-MM-DD
  };

  // Supprimer les champs vides ou undefined
  Object.keys(fields).forEach(key => {
    if (fields[key] === undefined || fields[key] === "") {
      delete fields[key];
    }
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Postuler`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Airtable :", data);
      return res.status(response.status).json({ 
        error: 'Erreur Airtable', 
        details: data 
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Exception :", error);
    res.status(500).json({ error: error.message });
  }
}
