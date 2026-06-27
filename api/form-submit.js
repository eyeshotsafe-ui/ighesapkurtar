// /api/form-submit.js — Web sitesindeki başvuru formundan gelen veriyi vaka olarak kaydeder
const { createCase } = require('./_case-store');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, followers, type, description, package: pkg, contact } = req.body || {};

    if (!username || !description) {
      return res.status(400).json({ error: 'Eksik bilgi' });
    }

    let phone = null;
    let email = null;
    if (contact) {
      if (String(contact).includes('@')) email = contact;
      else phone = contact;
    }

    const created = await createCase({
      source: 'form',
      status: 'yeni',
      name: 'Web Sitesi Başvurusu',
      username,
      followers,
      type,
      description,
      package: pkg,
      phone,
      email
    });

    console.log(`[Form] Yeni başvuru kaydedildi: ${created.id}`);
    return res.status(200).json({ success: true, id: created.id });
  } catch (error) {
    console.error('[FormSubmit] Hata:', error);
    return res.status(500).json({ error: 'Kayıt başarısız' });
  }
}
