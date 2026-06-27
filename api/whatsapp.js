// /api/whatsapp.js — WhatsApp AI Asistan (Twilio + Claude)
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER; // format: whatsapp:+1234567890

// Basit bellek: son mesajları tut (serverless restart'larda sıfırlanır)
// Production'da Redis/KV kullanılabilir
const conversations = new Map();

const SYSTEM_PROMPT = `Sen "IG Hesap Kurtar" (ighesapkurtar.com) şirketinin WhatsApp üzerinden hizmet veren yapay zeka müşteri temsilcisisin.

## KİMLİĞİN VE ÜSLUBUN
- Adın yok, "IG Hesap Kurtar ekibi" olarak konuş
- Samimi, güven veren, profesyonel ama sıcak bir üslupla konuş
- Türkçe konuş, müşteri İngilizce yazarsa İngilizce yanıt ver
- WhatsApp'a uygun kısa paragraflar yaz (uzun duvarlar gibi mesajlar gönderme)
- Emojileri ölçülü ama etkili kullan
- Her mesajda müşteriyi anlayışla karşıla, empati göster
- Hesabını kaybetmiş birinin stresli olduğunu unutma, sakinleştirici ol

## HİZMETLER
Kapatılan, hacklenen, askıya alınan, devre dışı bırakılan Instagram hesaplarını kurtarıyoruz:
- Topluluk kuralları ihlali nedeniyle kapatılan hesaplar
- Hacklenen ve ele geçirilen hesaplar (e-posta/şifre değiştirilmiş olsa bile)
- Askıya alınan hesaplar (geçici veya kalıcı)
- İki faktörlü doğrulama (2FA) sorunları
- İşletme ve onaylı hesap kurtarma
- Shadow ban ve kalıcı ban kaldırma

## FİYATLAR
- 📋 Başlangıç Paketi: 3.999₺ — 10K altı takipçili kişisel hesaplar
- ⭐ Profesyonel Paket: 5.999₺ — 10K-50K takipçili hesaplar, öncelikli işlem
- 🏆 VIP Paket: 8.999₺ — 50K+ takipçili ve işletme hesapları, acil müdahale
- Tüm paketlerde başarısız olursa %50 iade garantisi
- Süre: 3-7 gün (Instagram destek hattının cevap hızına göre değişir)

## ÖDEME YÖNTEMLERİ
- 💳 Kredi/Banka Kartı ile online ödeme (Shopier güvenli altyapısı)
- Ödeme linkleri:
  - Başlangıç: https://www.shopier.com/ighesapkurtar/48444713
  - Profesyonel: https://www.shopier.com/ighesapkurtar/48444724
  - VIP: https://www.shopier.com/ighesapkurtar/48444736

## SÜREÇ
1. Müşteriden şu bilgileri al: Instagram kullanıcı adı, yaklaşık takipçi sayısı, hesap türü (kişisel/işletme), ne olduğunu kısaca anlatan açıklama
2. Bilgilere göre uygun paketi öner
3. Ödeme linkini paylaş
4. Ödeme onaylandıktan sonra ekibin sürece başlayacağını bildir

## İSTATİSTİKLER
- 2.400+ başarıyla kurtarılan hesap
- %95+ başarı oranı
- 3-7 gün ortalama çözüm süresi (Instagram destek hattının cevap hızına göre değişir)

## GÜVENLİK
- Müşteriden asla şifre veya kişisel bilgi isteme
- Instagram'ın resmi kanalları üzerinden yasal çerçevede çalıştığımızı belirt
- Hesap herhangi bir ek risk altına girmiyor

## KONUŞMA AKIŞI
İlk mesajda müşteriyi karşıla ve sorununu sor. Sonra şu bilgileri topla:
1. Instagram kullanıcı adı
2. Yaklaşık takipçi sayısı
3. Kişisel mi işletme mi?
4. Ne olduğunu kısaca anlatsın

Bilgileri aldıktan sonra uygun paketi öner ve ödeme linkini gönder.

## KURALLAR
- Asla şifre, kimlik bilgisi veya kişisel veri isteme
- Hesap kurtarma dışı konularda kibarca yönlendir
- Rakip hizmetler hakkında yorum yapma
- Kesin tarih verme, "genellikle" ve "çoğunlukla" gibi ifadeler kullan
- Dolandırıcılık konusunda uyarılarda bulun
- Müşteri kızgın veya endişeliyse ekstra empati göster
- Web sitesi: www.ighesapkurtar.com
- E-posta: yardim@ighesapkurtar.com`;

module.exports = async function handler(req, res) {
  // Twilio sends POST for incoming messages
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'WhatsApp AI Webhook aktif' });
  }

  try {
    const { Body: message, From: from, To: to, ProfileName: name } = req.body;

    if (!message || !from) {
      return res.status(200).send('<Response></Response>');
    }

    console.log(`[WhatsApp] ${name || from}: ${message}`);

    // Konuşma geçmişi (basit bellek — son 20 mesaj)
    const convKey = from;
    if (!conversations.has(convKey)) {
      conversations.set(convKey, []);
    }
    const history = conversations.get(convKey);
    history.push({ role: 'user', content: message });

    // Son 20 mesajı tut
    if (history.length > 20) {
      conversations.set(convKey, history.slice(-20));
    }

    // Claude AI ile yanıt üret
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT + `\n\nMüşteri bilgisi: İsim: ${name || 'Bilinmiyor'}, Numara: ${from}`,
        messages: history
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('[WhatsApp] Anthropic API hatası:', aiResponse.status, JSON.stringify(aiData));
    }

    const reply = aiData.content?.[0]?.text || 'Şu anda yanıt veremedim. Lütfen web sitemiz üzerinden bize ulaşın: www.ighesapkurtar.com';

    // Yanıtı geçmişe ekle
    history.push({ role: 'assistant', content: reply });

    // Twilio ile WhatsApp üzerinden yanıt gönder
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const twilioAuth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

    await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: from,
        From: TWILIO_WHATSAPP,
        Body: reply
      })
    });

    console.log(`[WhatsApp] Yanıt gönderildi: ${reply.substring(0, 100)}...`);

    // Twilio'ya boş TwiML yanıt (çift mesaj göndermeyi önler)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('[WhatsApp] Hata:', error);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }
}
