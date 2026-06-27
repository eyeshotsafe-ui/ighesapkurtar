// /api/shopier-webhook.js — Shopier'dan gelen ödeme bildirimini vaka olarak kaydeder
// Shopier panelinde: Ayarlar → Webhook/Bildirim URL → https://www.ighesapkurtar.com/api/shopier-webhook
const { createCase } = require('./_case-store');
const { sendWhatsApp } = require('./_notify');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  // Shopier form-urlencoded, JSON veya query param ile gönderebilir — hepsini kabul et
  const body = { ...req.query, ...(req.body || {}) };

  console.log('[Shopier] Webhook geldi:', JSON.stringify(body));

  try {
    const orderId = body.platform_order_id || body.order_id || body.orderId || null;
    const buyerName = [body.buyer_name, body.buyer_surname].filter(Boolean).join(' ')
      || body.buyerName || body.ad_soyad || 'Shopier Müşterisi';
    const email = body.buyer_email || body.email || null;
    const phone = body.buyer_phone || body.phone || null;
    const productName = body.product_name || body.productName || null;
    const amount = body.total_order_value || body.amount || body.price || null;
    const currency = body.currency || 'TRY';

    // Ürün adından paketi tahmin et
    let pkg = null;
    if (productName) {
      const p = productName.toLowerCase();
      if (p.includes('vip')) pkg = 'vip';
      else if (p.includes('profesyonel')) pkg = 'profesyonel';
      else if (p.includes('başlangıç') || p.includes('baslangic')) pkg = 'baslangic';
    }

    const created = await createCase({
      source: 'shopier',
      status: 'odeme_alindi',
      name: buyerName,
      email,
      phone,
      package: pkg,
      description: productName ? `Ürün: ${productName}` : 'Shopier siparişi',
      amount,
      currency,
      orderId,
      raw: body
    });

    console.log(`[Shopier] Vaka oluşturuldu: ${created.id}`);

    // Müşteriye otomatik WhatsApp onayı gönder (numara varsa ve sandbox'a katılmışsa çalışır)
    if (phone) {
      const msg = `Merhaba ${buyerName}! 🎉 Ödemeniz alındı${orderId ? ` (Sipariş: ${orderId})` : ''}. Ekibimiz en kısa sürede hesabınızla ilgili sürece başlayacak. Sorularınız için buradan yazabilirsiniz.`;
      await sendWhatsApp(phone, msg).catch(() => {});
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Shopier] Hata:', error);
    return res.status(200).send('OK'); // Shopier'ın tekrar denemesini önlemek için her durumda 200
  }
}
