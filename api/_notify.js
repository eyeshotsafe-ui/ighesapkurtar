// /api/_notify.js — WhatsApp bildirim gönderme yardımcı fonksiyonu (telefon formatı otomatik düzeltilir)
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER;

function toWhatsAppFormat(phone) {
  if (!phone) return null;
  let p = String(phone).trim();
  if (p.startsWith('whatsapp:')) return p;
  p = p.replace(/[^\d+]/g, '');
  if (p.startsWith('+')) return `whatsapp:${p}`;
  if (p.startsWith('0')) return `whatsapp:+90${p.slice(1)}`;
  if (p.startsWith('90')) return `whatsapp:+${p}`;
  if (p.length === 10) return `whatsapp:+90${p}`; // 5XXXXXXXXX
  return `whatsapp:+${p}`;
}

async function sendWhatsApp(phoneRaw, body) {
  const to = toWhatsAppFormat(phoneRaw);
  if (!to || !TWILIO_SID || !TWILIO_TOKEN || !TWILIO_WHATSAPP) return false;

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const twilioAuth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${twilioAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: TWILIO_WHATSAPP, Body: body })
    });
    return res.ok;
  } catch (e) {
    console.error('[Notify] Hata:', e.message);
    return false;
  }
}

module.exports = { sendWhatsApp, toWhatsAppFormat };
