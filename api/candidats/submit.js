/**
 * RH-PROSPECTS — /api/candidats/submit.js
 * Reçoit les soumissions du formulaire candidat, applique le nettoyage RGPD,
 * puis relaie vers n8n pour traitement (scoring IA + insertion Airtable).
 *
 * Variables d'env :
 *   N8N_WEBHOOK_URL_CV  → https://smconsulting.app.n8n.cloud/webhook/VOTRE_ID
 *   N8N_API_KEY         → clé secrète partagée
 *   ALLOWED_ORIGIN      → https://www.rh-prospects.fr
 *   MAX_CV_SIZE_MB      → 5 (taille max fichier CV en MB)
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

function rgpdClean(data) {
  const allowed = ['prenom', 'nom', 'email', 'telephone', 'poste_vise', 'experience_annees',
                   'competences', 'disponibilite', 'cv_base64', 'cv_filename', 'cv_mimetype',
                   'linkedin_url', 'message', 'consentement_rgpd'];
  const cleaned = {};
  for (const key of allowed) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      cleaned[key] = data[key];
    }
  }
  if (cleaned.telephone) {
    cleaned._telephone_hash = Buffer.from(cleaned.telephone).toString('base64').substring(0, 8);
  }
  return cleaned;
}

function validate(data) {
  const errors = [];
  if (!data.prenom?.trim()) errors.push('Prénom requis');
  if (!data.nom?.trim()) errors.push('Nom requis');
  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('Email invalide');
  if (!data.poste_vise?.trim()) errors.push('Poste visé requis');
  if (!data.consentement_rgpd) errors.push('Consentement RGPD requis');
  if (data.cv_base64) {
    const sizeBytes = (data.cv_base64.length * 3) / 4;
    const maxBytes = (parseInt(process.env.MAX_CV_SIZE_MB || 5)) * 1024 * 1024;
    if (sizeBytes > maxBytes) errors.push(`CV trop volumineux (max ${process.env.MAX_CV_SIZE_MB || 5}MB)`);
  }
  return errors;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://www.rh-prospects.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawData = req.body;
  const errors = validate(rawData);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }

  const cleanData = rgpdClean(rawData);

  const n8nPayload = {
    source:   'rh_prospects_form',
    candidat: cleanData,
    meta: {
      submitted_at: new Date().toISOString(),
      ip_hash:      Buffer.from(req.headers['x-forwarded-for'] || 'unknown').toString('base64').substring(0, 12),
      user_agent:   req.headers['user-agent']?.substring(0, 100) || 'unknown',
    },
  };

  try {
    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL_CV, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.N8N_API_KEY,
      },
      body: JSON.stringify(n8nPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!n8nRes.ok) throw new Error(`n8n responded ${n8nRes.status}`);

    console.log('[RH] Candidature relayée:', cleanData.email?.replace(/(.{2}).+(@.+)/, '$1***$2'));
    return res.status(200).json({
      success: true,
      message: 'Candidature reçue. Vous recevrez une réponse sous 48h.',
    });

  } catch (err) {
    console.error('[RH] n8n relay error:', err.message);
    return res.status(502).json({
      error: 'Erreur technique. Merci de réessayer ou de nous contacter par email.',
    });
  }
}
