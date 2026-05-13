export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Retourne directement des offres factices pour vérifier que la route fonctionne
  const mockOffres = [
    {
      id: '1',
      titre: 'Développeur Fullstack Senior',
      entreprise: 'TechCorp',
      localisation: 'Paris',
      type_contrat: 'CDI',
      salaire: '65-85k€',
      description: 'Poste challengeant avec stack moderne',
      competences_requises: 'React, Node.js, TypeScript',
      date_publication: new Date().toISOString()
    }
  ];
  
  return res.status(200).json(mockOffres);
}
