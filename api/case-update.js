// /api/case-update.js — Vaka durumunu güncelle + müşteriye otomatik WhatsApp bildirimi gönder
const { kv } = require('./_kv');

const ADMIN_KEY = process.env.ADMIN_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER;

// Durum değiştiğinde müşteriye gönderilecek otomatik mesaj şablonları
const STATUS_MESSAGES = {
  inceleniyor: (name) =>
    `Merhaba ${name} 👋 Hesabınızla ilgili durumu ekibimiz şu anda inceliyor. En kısa sürede bir sonraki adımı sizinle paylaşacağız.`,
  itiraz_gonderildi: (name) =>
    `Merhaba ${name} ✅ Hesabınız için Instagram'a resmi itiraz gönderildi. Genellikle yanıt 3-7 gün içinde geliyor, gelişmeleri buradan paylaşacağız.`,
  instagram_bekleniyor: (name) =>
    `Merhaba ${name}, itirazınız şu anda Instagram tarafında değerlendiriliyor. Biraz daha sabrınızı rica ediyoruz 🙏 Haber gelir gelmez sizi bilgilendireceğiz.`,
  kurtarildi: (name) =>
    `🎉 Müjde ${name}! Hesabınız başarıyla kurtarıldı. Giriş yapıp kontrol edebilirsiniz. Bizi tercih ettiğiniz için teşekkür ederiz!`,
  basarisiz: (name) =>
    `Merhaba ${name}, bu denemede hesabınızı kurtaramadık 😔 %50 iade süreciniz başlatılıyor ve kısa süre içinde tamamlanacak. Başka yardımcı olabileceğimiz bir konu olursa buradayız.`
};

const VALID_STATUSES = ['yeni', 'inceleniyor', 'itiraz_gonderildi', 'instagram_bekleniyor', 'kurtarildi', 'basarisiz'];

async function sendWhatsApp(to, body) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const twilioAuth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

  const res = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${twilioAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: to, From: TWILIO_WHATSAPP, Body: body })
  });
  return res.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = req.headers['x-admin-key'] || req.body.key;
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const { id, status, notify } = req.body;

  if (!id || !status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz id veya status' });
  }

  try {
    const raw = await kv('get', `case:${id}`);
    if (!raw) {
      return res.status(404).json({ error: 'Vaka bulunamadı' });
    }

    const caseData = JSON.parse(raw);
    caseData.status = status;
    caseData.updatedAt = new Date().toISOString();

    await kv('set', `case:${id}`, JSON.stringify(caseData));

    let notified = false;
    if (notify !== false && STATUS_MESSAGES[status]) {
      const message = STATUS_MESSAGES[status](caseData.name || 'değerli müşterimiz');
      try {
        notified = await sendWhatsApp(caseData.phone, message);
      } catch (e) {
        console.error('[CaseUpdate] WhatsApp gönderim hatası:', e.message);
      }
    }

    return res.status(200).json({ success: true, case: caseData, notified });
  } catch (error) {
    console.error('[CaseUpdate] Hata:', error);
    return res.status(500).json({ error: 'Güncelleme başarısız', detail: error.message });
  }
}
