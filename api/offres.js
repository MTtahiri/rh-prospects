const Airtable = require('airtable');

const base = new Airtable({ 
    apiKey: process.env.AIRTABLE_API_KEY 
}).base('appG0HD7kW6ejvCkG'); // Ton ID de base extrait de ton lien

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const records = await base('Offres').select({
      // IMPORTANT : Vérifie que tu as bien une colonne "Statut" avec "Ouverte"
      // Si tu veux tout afficher sans filtre, supprime la ligne filterByFormula
      filterByFormula: "{Statut} = 'Ouverte'",
      view: "Grid view" 
    }).all();

    const cleanOffres = records.map(record => ({
      id: record.id,
      titre: record.get('Titre de la mission') || record.get('Poste'),
      client: record.get('Client') || "Confidentiel",
      type: record.get('Type de contrat') || "Freelance",
      lieu: record.get('Localisation') || "France / Remote",
      tjm: record.get('TJM') || record.get('Salaire'),
      secteur: record.get('Secteur d\'activité'),
      dateDebut: record.get('Date de démarrage'),
      competences: record.get('Compétences clés'), // Si c'est un champ de type texte ou multi-select
      description: record.get('Description'),
      lien: record.get('Lien de l\'offre') || "#"
    }));

    res.status(200).json(cleanOffres);
  } catch (error) {
    res.status(500).json({ error: "Erreur Airtable", message: error.message });
  }
}
