// /api/_case-store.js — Ortak vaka veritabanı işlemleri (KV üzerinde)
const { kv } = require('./_kv');

async function createCase(data) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newCase = {
    id,
    source: data.source || 'unknown', // 'whatsapp' | 'form' | 'shopier'
    status: data.status || 'yeni',
    name: data.name || 'Bilinmiyor',
    phone: data.phone || null,
    email: data.email || null,
    username: data.username || null,
    followers: data.followers || null,
    type: data.type || null,
    description: data.description || null,
    package: data.package || null,
    amount: data.amount || null,
    currency: data.currency || null,
    orderId: data.orderId || null,
    raw: data.raw || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await kv('set', `case:${id}`, JSON.stringify(newCase));
  await kv('lpush', 'cases:all', id);
  if (newCase.phone) {
    await kv('set', `phone-case:${newCase.phone}`, id);
  }

  return newCase;
}

async function getCaseById(id) {
  const raw = await kv('get', `case:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function getCaseIdByPhone(phone) {
  if (!phone) return null;
  return await kv('get', `phone-case:${phone}`);
}

async function updateCase(id, patch) {
  const existing = await getCaseById(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await kv('set', `case:${id}`, JSON.stringify(updated));
  return updated;
}

module.exports = { createCase, getCaseById, getCaseIdByPhone, updateCase };
