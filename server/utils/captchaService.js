const crypto = require('crypto');

const SECRET_KEY = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'sharemeal-captcha-secret-salt-2026';

/**
 * Generate a randomized alphanumeric CAPTCHA with SVG rendering and HMAC signature
 */
const generateCaptcha = () => {
  // Avoid visually ambiguous characters (0, O, 1, I, l)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let text = '';
  for (let i = 0; i < 5; i++) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes
  const payload = `${text.toUpperCase()}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  const captchaId = `${Buffer.from(payload).toString('base64url')}.${signature}`;

  // Palette for text & noise
  const palette = ['#1e40af', '#b91c1c', '#047857', '#c2410c', '#6d28d9', '#0369a1'];

  // Random noise lines
  let linesSvg = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * 20);
    const y1 = Math.floor(Math.random() * 45) + 5;
    const x2 = Math.floor(Math.random() * 40) + 120;
    const y2 = Math.floor(Math.random() * 45) + 5;
    const stroke = palette[Math.floor(Math.random() * palette.length)];
    const strokeWidth = (Math.random() * 1.5 + 1).toFixed(1);
    linesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-opacity="0.55" />`;
  }

  // Random noise dots
  let dotsSvg = '';
  for (let i = 0; i < 24; i++) {
    const cx = Math.floor(Math.random() * 160);
    const cy = Math.floor(Math.random() * 48) + 2;
    const r = (Math.random() * 1.5 + 0.8).toFixed(1);
    const fill = palette[Math.floor(Math.random() * palette.length)];
    dotsSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.4" />`;
  }

  // Render individual letters with rotation & offset
  let charsSvg = '';
  const startX = 18;
  const stepX = 26;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = startX + i * stepX + (Math.random() * 4 - 2);
    const y = 33 + (Math.random() * 6 - 3);
    const rot = Math.floor(Math.random() * 32) - 16;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const fontSize = Math.floor(Math.random() * 4) + 23;
    charsSvg += `<text x="${x}" y="${y}" font-family="'Courier New', monospace, sans-serif" font-size="${fontSize}" font-weight="900" fill="${color}" transform="rotate(${rot} ${x} ${y})">${char}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48" style="border-radius:10px;background:#f8fafc;border:1.5px solid #cbd5e1;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);user-select:none;">
    ${dotsSvg}
    ${linesSvg}
    ${charsSvg}
  </svg>`;

  return {
    captchaId,
    svg
  };
};

/**
 * Verify a user-submitted CAPTCHA against its signed token
 */
const verifyCaptcha = (captchaId, answer) => {
  if (!captchaId || typeof captchaId !== 'string' || !answer || typeof answer !== 'string') {
    return false;
  }

  const parts = captchaId.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [b64Payload, signature] = parts;
  let payload;
  try {
    payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  if (signature !== expectedSignature) {
    return false;
  }

  const [expectedText, expiresAtStr] = payload.split(':');
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Expired
  }

  return expectedText.trim().toUpperCase() === answer.trim().toUpperCase();
};

module.exports = {
  generateCaptcha,
  verifyCaptcha
};

