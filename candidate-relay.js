/**
 * RH-PROSPECTS — /api/candidate-relay.js
 * Relay sécurisé : Frontend → Vercel → n8n (RGPD compliant)
 * Variables d'env Vercel :
 *   N8N_API_KEY               → clé partagée avec n8n (header X-API-KEY)
 *   N8N_CANDIDATES_WEBHOOK_URL → https://smconsulting.app.n8n.cloud/webhook/VOTRE_ID
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { candidateData } = req.body;
  const N8N_API_KEY = process.env.N8N_API_KEY;

  // Auth — même standard que tous nos relais
  const incomingKey = req.headers['x-api-key'];
  if (!incomingKey || incomingKey !== N8N_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validation RGPD minimale
  if (!candidateData?.email || !candidateData?.lastName) {
    return res.status(400).json({ error: 'Données candidat incomplètes' });
  }

  // Sanitisation — champs autorisés uniquement
  const sanitizedData = {
    firstName:  (candidateData.firstName || '').trim().substring(0, 100),
    lastName:   (candidateData.lastName  || '').trim().substring(0, 100),
    email:      (candidateData.email     || '').trim().toLowerCase(),
    phone:      (candidateData.phone     || '').trim().substring(0, 20),
    cvUrl:      (candidateData.cvUrl     || '').trim(),
    message:    (candidateData.message   || '').trim().substring(0, 1000),
    source:     'rh-prospects.fr',
    timestamp:  new Date().toISOString()
  };

  try {
    const response = await fetch(process.env.N8N_CANDIDATES_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': N8N_API_KEY   // ← standard unifié
      },
      body: JSON.stringify(sanitizedData),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`n8n responded ${response.status}`);

    return res.status(200).json({ success: true, message: 'Candidature reçue.' });
  } catch (error) {
    console.error('[Candidate Relay]', error.message);
    return res.status(500).json({ error: 'Erreur traitement candidature.' });
  }
}
