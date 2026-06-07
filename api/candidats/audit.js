/**
 * RH-PROSPECTS — /api/candidats/audit.js
 * Déclenche un audit IA d'un profil candidat existant en Airtable.
 * Protégé par N8N_API_KEY — usage interne uniquement (pas exposé au public).
 *
 * Variables d'env :
 *   N8N_WEBHOOK_URL_AUDIT → https://smconsulting.app.n8n.cloud/webhook/VOTRE_ID
 *   N8N_API_KEY           → clé secrète partagée
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.N8N_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { airtable_record_id, audit_type = 'full' } = req.body;

  if (!airtable_record_id) {
    return res.status(400).json({ error: 'airtable_record_id requis' });
  }

  const validAuditTypes = ['full', 'skills_only', 'culture_fit'];
  if (!validAuditTypes.includes(audit_type)) {
    return res.status(400).json({ error: `audit_type invalide. Valeurs: ${validAuditTypes.join(', ')}` });
  }

  const n8nPayload = {
    source:             'audit_trigger',
    airtable_record_id: String(airtable_record_id).trim(),
    audit_type,
    triggered_at:       new Date().toISOString(),
  };

  try {
    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL_AUDIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.N8N_API_KEY,
      },
      body: JSON.stringify(n8nPayload),
      signal: AbortSignal.timeout(30000),
    });

    if (!n8nRes.ok) throw new Error(`n8n responded ${n8nRes.status}`);

    const result = await n8nRes.json();
    return res.status(200).json({ success: true, audit_result: result });

  } catch (err) {
    console.error('[Audit] Error:', err.message);
    return res.status(502).json({ error: 'Audit trigger failed', detail: err.message });
  }
}
