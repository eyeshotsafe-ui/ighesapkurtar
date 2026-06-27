// /api/chat.js
// Tarayıcıdan gelen chatbot isteklerini, API key'i güvenli tutarak Claude API'ye iletir.
// API key tarayıcıya ASLA gönderilmez — sadece Vercel sunucusunda env variable olarak saklanır.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { system, messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages alanı gerekli' });
    return;
  }

  // Basit kötüye kullanım koruması: çok uzun mesaj dizilerini reddet
  if (messages.length > 20) {
    res.status(400).json({ error: 'Mesaj geçmişi çok uzun' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Sunucu yapılandırma hatası: API key eksik' });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: system || '',
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bilinmeyen hata' });
  }
};
