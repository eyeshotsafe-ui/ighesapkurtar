// /api/cases.js — Vakaları listeler (admin paneli için)
const { kv } = require('./_kv');

const ADMIN_KEY = process.env.ADMIN_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = req.headers['x-admin-key'] || req.query.key;
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  try {
    const ids = await kv('lrange', 'cases:all', '0', '299');

    if (!ids || ids.length === 0) {
      return res.status(200).json({ cases: [] });
    }

    const cases = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = await kv('get', `case:${id}`);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })
    );

    const validCases = cases.filter(Boolean).sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return res.status(200).json({ cases: validCases });
  } catch (error) {
    console.error('[Cases] Hata:', error);
    return res.status(500).json({ error: 'Vakalar yüklenemedi', detail: error.message });
  }
}
