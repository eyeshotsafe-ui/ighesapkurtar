# Shopier Webhook Kurulumu

## Amaç
Bir müşteri Shopier üzerinden ödeme yaptığında, bu bilgi otomatik olarak admin panelindeki vaka listesine eklensin ve mümkünse müşteriye otomatik WhatsApp onayı gitsin.

## Kurulum Adımları

1. **Shopier Mağaza Paneline** giriş yap (shopier.com)
2. **Ayarlar** → **Entegrasyonlar** veya **Webhook Ayarları** bölümünü bul
   (Shopier panel menüsü zamanla değişebilir; "Bildirim URL", "Webhook URL" veya "API Callback URL" gibi bir alan arıyoruz)
3. Bu alana şu adresi yapıştır:
   ```
   https://www.ighesapkurtar.com/api/shopier-webhook
   ```
4. Kaydet

## Önemli Not — İlk Test

Shopier'ın gönderdiği verinin tam formatını görmeden alan adlarını (buyer_name, total_order_value vs.) %100 garanti edemeyiz çünkü Shopier dokümantasyonu hesaba/entegrasyon türüne göre değişebilir.

**Yapmamız gereken:**
1. Webhook URL'i kaydet
2. Test amaçlı küçük bir ödeme yap (kendi kartınla, sonra iade edebilirsin) veya bir arkadaşına 1₺'lik test ürünü ile denetelim
3. Vercel Logs'ta `[Shopier] Webhook geldi:` satırını bul — bu, Shopier'ın gönderdiği ham veriyi gösterir
4. O veriyi bana gönder, gerekirse `shopier-webhook.js` dosyasındaki alan eşleştirmesini birlikte düzeltiriz

Bu adım sayesinde sistemin %100 doğru çalıştığından emin oluruz.

## Admin Panelinde Görünüm

Ödeme webhook'u tetiklendiğinde admin panelinde (`/admin.html`):
- Kaynak: 💳 Shopier
- Durum: "Ödeme Alındı" (otomatik)
- Tutar ve sipariş numarası görünür
- "Ham Veri" butonuna basarak Shopier'ın gönderdiği tüm veriyi inceleyebilirsin (alan eşleştirmesi yanlışsa burada görürsün)
- Müşteri telefon numarası varsa ve WhatsApp sandbox'a katılmışsa otomatik onay mesajı gider
