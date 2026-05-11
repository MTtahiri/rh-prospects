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

  // Ne garder que les champs qui existent dans la table Postuler (d'après votre structure)
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
    competences: req.body.competences || "",
    description: req.body.description || "",
    tjm: req.body.tjm ? Number(req.body.tjm) : undefined,
    cv_url: req.body.cv_url || "",
    statut: "Nouveau",
    date_creation: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  };

  // Supprimer les champs vides ou undefined pour éviter les erreurs Airtable
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
