// /api/form-submit.js — Web sitesindeki başvuru formundan gelen veriyi vaka olarak kaydeder + SMS bildirim
const { createCase } = require('./_case-store');

// Twilio SMS gönderme fonksiyonu
async function sendSmsNotification(caseData) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;    // Twilio numaranız (SMS gönderecek numara)
  const to = process.env.ADMIN_PHONE;          // Senin telefon numaran (bildirimi alacak)

  if (!sid || !token || !from || !to) {
    console.log('[SMS] Twilio env değişkenleri eksik, bildirim gönderilmedi.');
    return;
  }

  const pkg = caseData.package || 'Belirtilmedi';
  const contact = caseData.phone || caseData.email || 'Yok';
  const followers = caseData.followers || '?';

  const body = `🔔 YENİ LEAD!\n\n@${caseData.username}\nTakipçi: ${followers}\nPaket: ${pkg}\nİletişim: ${contact}\nTür: ${caseData.type || '-'}\n\n15 dk içinde ara!`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString()
    });

    if (resp.ok) {
      console.log('[SMS] Bildirim gönderildi.');
    } else {
      const err = await resp.text();
      console.error('[SMS] Gönderilemedi:', err);
    }
  } catch (error) {
    console.error('[SMS] Hata:', error.message);
    // SMS hatası form kaydını engellemez — sessizce logla, devam et
  }
}

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

    const caseData = {
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
    };

    const created = await createCase(caseData);

    console.log(`[Form] Yeni başvuru kaydedildi: ${created.id}`);

    // SMS bildirimi gönder (arka planda, form yanıtını bekletmez)
    sendSmsNotification({ ...caseData, id: created.id }).catch(() => {});

    return res.status(200).json({ success: true, id: created.id });
  } catch (error) {
    console.error('[FormSubmit] Hata:', error);
    return res.status(500).json({ error: 'Kayıt başarısız' });
  }
}
