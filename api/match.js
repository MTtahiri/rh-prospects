// v2 — updated AIRTABLE_TOKEN (2026-06-13)
// api/match.js — Moteur de matching offres ↔ vivier candidats RH-Prospects
// Prend un texte d'offre, retourne le top N candidats scorés depuis Airtable.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { offreText, topN = 10 } = req.body || {};
  if (!offreText || typeof offreText !== 'string' || offreText.trim().length < 10) {
    return res.status(400).json({ error: 'offreText requis (min 10 caractères)' });
  }

  const TOKEN = process.env.AIRTABLE_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'AIRTABLE_TOKEN manquant en env' });

  const BASE  = 'appNwg9iP8ub0cDCn';   // Base_Candidats_Master_2025
  const TABLE = 'tblB2QFKXVKeJPNg1';   // Candidats

  // ── 1. Fetch TOUS les candidats (pagination 100/page) ────────────────────
  let allRecords = [];
  let offset = null;

  const FIELDS = [
    'Nom', 'Courriel', 'Telephone', 'Role',
    'Stack', 'Competences', 'Specialites',
    'Experience', 'Localisation', 'Niveau',
    'Disponibilite', 'TypeContrat', 'TJM',
    '🧠 Contexte_Réel', '⭐ Score_Confiance',
  ];
  const fieldsQS = FIELDS.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  try {
    do {
      const url = `https://api.airtable.com/v0/${BASE}/${TABLE}?pageSize=100&${fieldsQS}${
        offset ? `&offset=${encodeURIComponent(offset)}` : ''
      }`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
      if (!r.ok) {
        const txt = await r.text();
        return res.status(502).json({ error: `Airtable ${r.status}`, details: txt.slice(0, 200) });
      }
      const data = await r.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);
  } catch (e) {
    return res.status(500).json({ error: 'Fetch Airtable échoué', details: e.message });
  }

  // ── 2. Algorithme de scoring ─────────────────────────────────────────────
  const offreNorm  = normalize(offreText);
  const offreTokens = tokens(offreNorm);

  // Bonus de disponibilité (plus le candidat est dispo, plus il monte)
  const DISPO_BONUS = {
    'Disponible': 25,
    'En recherche': 20,
    'Indépendant/Consultant': 15,
    'Indépendante': 15,
    'En poste': 5,
    'Alternance / CDI': 4,
    'CDI': 3,
  };

  const scored = allRecords.map(rec => {
    const f = rec.fields;

    const stackNorm  = normalize(f['Stack']        || '');
    const compNorm   = normalize(f['Competences']  || '');
    const roleNorm   = normalize(f['Role']         || '');
    const specNorm   = normalize(f['Specialites']  || '');
    const locNorm    = normalize(f['Localisation'] || '');
    const dispo      = f['Disponibilite'] || '';

    const stackTok = tokens(stackNorm);
    const compTok  = tokens(compNorm);
    const roleTok  = tokens(roleNorm);
    const specTok  = tokens(specNorm);

    let score = 0;
    const matched = new Set();

    // --- Matching compétences/technologies (cœur du score) ---
    for (const tok of offreTokens) {
      if (tok.length < 2) continue;

      if (stackTok.includes(tok)) {
        score += 12;
        matched.add(restoreCase(tok, f['Stack'] || ''));
      } else if (compTok.includes(tok)) {
        score += 8;
        matched.add(restoreCase(tok, f['Competences'] || ''));
      } else if (roleTok.includes(tok)) {
        score += 6;
      } else if (specTok.includes(tok)) {
        score += 3;
      }
    }

    // --- Bonus disponibilité ---
    score += DISPO_BONUS[dispo] || 0;

    // --- Bonus localisation ---
    const locParts = locNorm.split(/[\s,]+/).filter(t => t.length > 2);
    for (const lp of locParts) {
      if (offreNorm.includes(lp)) { score += 6; break; }
    }

    // --- Bonus Score_Confiance (notation interne 1–5) ---
    const conf = parseFloat(f['⭐ Score_Confiance']) || 0;
    if (conf > 0) score += conf * 3;

    // --- Pénalité si aucune compétence ne matche ---
    if (matched.size === 0 && score < 20) score = 0;

    return {
      id:           rec.id,
      nom:          f['Nom']          || '—',
      role:         f['Role']         || '',
      stack:        f['Stack']        || '',
      localisation: f['Localisation'] || '',
      disponibilite: dispo,
      experience:   f['Experience']  || '',
      niveau:       f['Niveau']      || '',
      telephone:    f['Telephone']   || '',
      email:        f['Courriel']    || '',
      tjm:          f['TJM']         || '',
      contexte:     (f['🧠 Contexte_Réel'] || '').slice(0, 200),
      matchedSkills: [...matched].slice(0, 8),
      score,
    };
  });

  const results = scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(topN, 20));

  // ── 3. Pré-formater le texte Slack ──────────────────────────────────────────
  const lines = results.map(c => {
    const skills = c.matchedSkills.length ? c.matchedSkills.join(', ') : '—';
    const dispo  = c.disponibilite || 'N/A';
    const tjm    = c.tjm || 'NC';
    const tel    = c.telephone || '—';
    const mail   = c.email || '—';
    return `*${c.score} pts — ${c.nom}* | ${c.role}\n📍 ${c.localisation} | ${dispo} | TJM: ${tjm}\n✅ ${skills}\n📞 ${tel} | ✉️ ${mail}`;
  });

  const slackText = results.length === 0
    ? '❌ Aucun candidat trouvé pour cette offre.'
    : `🤖 *Matching IA — Top ${results.length} candidats sur ${allRecords.length}*\n${'━'.repeat(20)}\n${lines.join('\n\n')}\n\n🔍 ${offreTokens.length} mots-clés extraits | 📊 https://rh-prospects.vercel.app/matching.html`;

  return res.status(200).json({
    results,
    totalCandidates: allRecords.length,
    matched: results.length,
    offreTokensCount: offreTokens.length,
    slackText,
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // accents → base letter
    .replace(/[^\w\s#+\/\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set([
  'les','des','une','dans','pour','avec','sur','par','est','sont','mais','donc',
  'vous','notre','vos','votre','nous','ils','elle','etre','avoir','faire','tout',
  'plus','bien','tres','aussi','quoi','que','qui','quand','comme','leur','leurs',
  'the','and','for','with','this','that','will','have','from','all','any','not',
  'your','our','team','work','vous','join','peut','peut','mise','sein','cadre',
  'dans','niveau','profil','annees','ans','minimum','experience','gestion',
]);

function tokens(text) {
  const raw = text.match(/[a-z0-9#][a-z0-9\-\.\/#+_]*/g) || [];
  return [...new Set(
    raw.filter(t => t.length >= 2 && !STOP.has(t))
  )];
}

// Retrouve la casse originale du token dans le texte source
function restoreCase(tok, source) {
  const re = new RegExp('\\b' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const m = source.match(re);
  return m ? m[0] : tok.toUpperCase();
}
