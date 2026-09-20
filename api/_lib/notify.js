const NOTIFY_TO = 'contact@rh-prospects.fr';
const NOTIFY_FROM = process.env.RESEND_FROM || 'RH-Prospects <onboarding@resend.dev>';

// Best-effort : ne doit jamais faire échouer la requête principale (l'écriture Airtable prime).
export async function sendNotificationEmail({ subject, lines }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[notify] RESEND_API_KEY manquant, notification email ignorée');
    return;
  }
  const html = lines
    .filter(([, value]) => value)
    .map(([label, value]) => `<p><strong>${label}</strong> : ${value}</p>`)
    .join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      console.error('[notify] Erreur Resend :', await response.text());
    }
  } catch (err) {
    console.error('[notify] Exception envoi email :', err.message);
  }
}
