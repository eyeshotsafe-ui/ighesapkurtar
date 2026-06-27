// /api/_kv.js — Vercel KV (Upstash Redis REST API) için ortak yardımcı fonksiyon
// Hiçbir npm paketi gerektirmez, doğrudan fetch ile REST API'ye bağlanır.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(...args) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV_REST_API_URL veya KV_REST_API_TOKEN env değişkeni eksik');
  }
  const path = args.map(a => encodeURIComponent(String(a))).join('/');
  const url = `${KV_URL}/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`KV hatası: ${data.error}`);
  }
  return data.result;
}

module.exports = { kv };
