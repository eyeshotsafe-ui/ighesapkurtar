# WhatsApp AI Asistan Kurulum Rehberi

## Adım 1: Twilio Hesabı Aç

1. **twilio.com** → Sign Up (ücretsiz deneme hesabı $15 kredi ile gelir)
2. Kayıt ol, e-posta doğrula, telefon doğrula

## Adım 2: Twilio'dan WhatsApp Numarası Al

### Seçenek A: Sandbox (Test — Ücretsiz)
1. Twilio Console → Messaging → Try it Out → **Send a WhatsApp message**
2. Twilio sana bir sandbox numarası verecek (test için)
3. Telefonundan o numaraya belirtilen kodu gönder (bağlantı kurulur)
4. Bu test amaçlıdır, gerçek müşteriler için Seçenek B gerekir

### Seçenek B: Gerçek WhatsApp Business Numarası (Production)
1. Twilio Console → Messaging → Senders → **WhatsApp senders**
2. "Register a WhatsApp sender" tıkla
3. Twilio'dan bir numara satın al ($1-2/ay)
4. WhatsApp Business profil bilgilerini doldur:
   - İşletme adı: IG Hesap Kurtar
   - Açıklama: Instagram Hesap Kurtarma Hizmeti
   - Profil resmi: favicon/logo
   - Web sitesi: www.ighesapkurtar.com
5. Meta onayı 1-3 gün sürer

## Adım 3: Twilio API Bilgilerini Al

1. Twilio Console → Ana sayfa
2. Şu bilgileri not al:
   - **Account SID**: ACxxxxxxxxxxxxxxxxxxxxxxxxxx
   - **Auth Token**: xxxxxxxxxxxxxxxxxxxxxxxxxx
3. Satın aldığın WhatsApp numarası: whatsapp:+1234567890

## Adım 4: Vercel Environment Variables

1. **vercel.com** → ighesapkurtar projesi → **Settings** → **Environment Variables**
2. Şu 4 değişkeni ekle:

| Key | Value |
|---|---|
| ANTHROPIC_API_KEY | sk-ant-xxxxxxxx (Anthropic API anahtarın) |
| TWILIO_ACCOUNT_SID | ACxxxxxxxxxx (Twilio'dan) |
| TWILIO_AUTH_TOKEN | xxxxxxxxxx (Twilio'dan) |
| TWILIO_WHATSAPP_NUMBER | whatsapp:+1234567890 (Twilio numaranız) |

3. Her değişken için "Production", "Preview", "Development" hepsini işaretle
4. **Save** tıkla

## Adım 5: Webhook'u Deploy Et ve Bağla

1. api/whatsapp.js dosyasını push et (aşağıdaki komutlarla)
2. Twilio Console → Messaging → Settings → **WhatsApp Sandbox Settings** (test) veya **WhatsApp Senders** (production)
3. Webhook URL olarak şunu gir:
   ```
   https://www.ighesapkurtar.com/api/whatsapp
   ```
4. Method: **POST**
5. Save

## Adım 6: Test Et

1. Telefonundan Twilio WhatsApp numarasına mesaj gönder
2. "Merhaba, hesabım kapatıldı" yaz
3. AI asistanın 2-3 saniye içinde yanıt vermesi gerekir

## Nasıl Çalışır?

```
Müşteri WhatsApp'tan mesaj yazar
    ↓
Twilio mesajı alır → webhook URL'e POST yapar
    ↓
Vercel serverless function (api/whatsapp.js) çalışır
    ↓
Claude AI mesajı analiz eder, yanıt üretir
    ↓
Twilio API ile yanıt WhatsApp'tan gönderilir
    ↓
Müşteri yanıtı WhatsApp'ta görür (2-3 saniye)
```

## AI Asistanın Yapabildiği Şeyler

- Müşteriyi karşılama ve sorununu anlama
- Instagram kullanıcı adı, takipçi sayısı, hesap türü bilgilerini toplama
- Uygun paketi önerme (3.999₺ / 5.999₺ / 8.999₺)
- Shopier ödeme linkini gönderme
- Süreç hakkında detaylı bilgi verme
- Güvenlik endişelerini giderme
- 7/24 kesintisiz çalışma
- Konuşma geçmişini hatırlama (aynı oturum içinde 20 mesaja kadar)

## Maliyet Tahmini

- Twilio numara: ~$1-2/ay
- WhatsApp mesaj (gelen): Ücretsiz
- WhatsApp mesaj (giden): ~$0.005-0.05/mesaj (ülkeye göre)
- Claude API: ~$0.003-0.01/yanıt
- **Toplam: Aylık ~$5-15 (düşük hacimde)**
