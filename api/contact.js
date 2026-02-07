/**
 * API de contato - 5diautil.com.br
 * Proteções: honeypot, Cloudflare Turnstile, validação, envio apenas para Telegram.
 * Nunca expõe email/Telegram no cliente.
 */

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TELEGRAM_API = 'https://api.telegram.org/bot';

// Limites de segurança
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

const ALLOWED_ORIGINS = [
  'https://www.5diautil.com.br',
  'https://5diautil.com.br',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function allowCors(origin) {
  return ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
}

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().slice(0, MAX_EMAIL_LENGTH);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function verifyTurnstile(token, remoteip, secret) {
  const res = await fetch(TURNSTILE_VERIFY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: remoteip || undefined,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

async function sendTelegram(text, botToken, chatId) {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram: ${res.status} ${err}`);
  }
}

export default async function handler(req, res) {
  const origin = allowCors(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!secret || !botToken || !chatId) {
    console.error('Contact API: missing env (TURNSTILE_SECRET_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)');
    return res.status(500).json({ success: false, error: 'Serviço indisponível' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ success: false, error: 'Dados inválidos' });
  }

  // 1) Honeypot: se vier preenchido, responde sucesso mas não envia (anti-bot)
  const honeypot = (body.website || body.url || body.company || '').trim();
  if (honeypot.length > 0) {
    return res.status(200).json({ success: true });
  }

  // 2) Turnstile obrigatório
  const turnstileToken = (body['cf-turnstile-response'] || body.turnstileToken || '').trim();
  if (!turnstileToken) {
    return res.status(400).json({ success: false, error: 'Validação de segurança obrigatória' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || '';
  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp, secret);
  if (!turnstileOk) {
    return res.status(400).json({ success: false, error: 'Validação de segurança falhou. Tente novamente.' });
  }

  // 3) Mensagem obrigatória e dentro dos limites
  const rawMessage = (body.message || '').trim();
  const message = sanitize(rawMessage, MAX_MESSAGE_LENGTH);
  if (message.length < MIN_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, error: 'Mensagem muito curta (mín. 10 caracteres)' });
  }

  const name = sanitize(body.name || '', MAX_NAME_LENGTH);
  const email = (body.email || '').trim().slice(0, MAX_EMAIL_LENGTH);
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'E-mail inválido' });
  }

  // Monta texto para o Telegram (sem expor dados sensíveis no log)
  const lines = ['📩 Contato 5diautil.com.br', '', message];
  if (name) lines.push('', `👤 ${name}`);
  if (email) lines.push(`✉️ ${email}`);
  const text = lines.join('\n');

  try {
    await sendTelegram(text, botToken, chatId);
  } catch (err) {
    console.error('Contact API Telegram error:', err.message);
    return res.status(500).json({ success: false, error: 'Falha ao enviar. Tente mais tarde.' });
  }

  return res.status(200).json({ success: true });
}
