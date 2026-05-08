#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_DIR = resolve(__dirname, '..', '..', '..');
const OPENCLAW_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

const args = process.argv.slice(2);

let imagePath = null;
let caption = '';
let chatId = null;
let telegramToken = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--image-path' && args[i + 1]) {
    imagePath = args[i + 1];
    i++;
  } else if (args[i] === '--caption' && args[i + 1]) {
    caption = args[i + 1];
    i++;
  } else if (args[i] === '--chat-id' && args[i + 1]) {
    chatId = args[i + 1];
    i++;
  } else if (args[i] === '--token' && args[i + 1]) {
    telegramToken = args[i + 1];
    i++;
  }
}

if (!imagePath) {
  console.error('ERROR: Missing required parameter --image-path');
  console.error('Usage: node send_photo.mjs --image-path "<PATH>" [--caption "<TEXT>"] [--chat-id "<ID>"] [--token "<TOKEN>"]');
  process.exit(1);
}

telegramToken = telegramToken || process.env.TELEGRAM_BOT_TOKEN;
chatId = chatId || process.env.TELEGRAM_CHAT_ID;

function loadTelegramConfigFallback() {
  const configPathCandidates = [
    resolve(process.cwd(), 'openclaw.json'),
    resolve(OPENCLAW_ROOT, 'openclaw.json')
  ];

  for (const configPath of configPathCandidates) {
    if (!existsSync(configPath)) continue;
    try {
      const raw = readFileSync(configPath, 'utf8');
      const cfg = JSON.parse(raw);
      const channelCfg = cfg?.channels?.telegram || {};
      const token = channelCfg?.botToken || null;
      const allowFrom = Array.isArray(channelCfg?.allowFrom) ? channelCfg.allowFrom : [];
      const defaultChatId = allowFrom.length > 0 ? String(allowFrom[0]) : null;
      return { token, chatId: defaultChatId };
    } catch {
      // Ignore unreadable or invalid config and continue trying candidates.
    }
  }

  return { token: null, chatId: null };
}

if (!telegramToken || !chatId) {
  const fallback = loadTelegramConfigFallback();
  telegramToken = telegramToken || fallback.token;
  chatId = chatId || fallback.chatId;
}

function sanitizeUserText(input) {
  let out = String(input || '');
  out = out.replace(/```[\s\S]*?```/g, '');
  out = out.replace(/\b[A-Za-z]:\\[^\s]+/g, '[hidden]');
  out = out.replace(/\/[A-Za-z0-9._\-\/]+/g, (m) => (m.includes('http') ? m : '[hidden]'));
  out = out.replace(/\b(node|npm|pnpm|python|powershell)\b[^\n]*/gi, '');
  out = out.replace(/[ \t]+\n/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

if (!telegramToken || !chatId) {
  console.error('ERROR: Missing Telegram credentials. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, pass --token and --chat-id, or configure channels.telegram.botToken + channels.telegram.allowFrom in openclaw.json.');
  process.exit(1);
}

function findImage(p) {
  if (existsSync(p)) return p;
  if (existsSync(join(WORKSPACE_DIR, p))) return join(WORKSPACE_DIR, p);
  if (existsSync(join(WORKSPACE_DIR, 'generated', 'images', p))) return join(WORKSPACE_DIR, 'generated', 'images', p);
  return null;
}

const foundPath = findImage(imagePath);
if (!foundPath) {
  console.error('ERROR: Image file not found:', imagePath);
  process.exit(1);
}

imagePath = foundPath;

async function sendPhoto() {
  const formData = new FormData();
  const imageBuffer = readFileSync(imagePath);
  const fileName = imagePath.split('/').pop();
  const safeCaption = sanitizeUserText(caption);
  
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('photo', blob, fileName);
  formData.append('chat_id', chatId);
  formData.append('caption', safeCaption);
  
  const url = `https://api.telegram.org/bot${telegramToken}/sendPhoto`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log(JSON.stringify({
        status: 'ok',
        message_id: result.result.message_id,
        chat_id: result.result.chat.id
      }, null, 2));
    } else {
      console.error(JSON.stringify({
        status: 'error',
        error_code: result.error_code,
        description: result.description
      }, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({
      status: 'error',
      error: err.message
    }, null, 2));
    process.exit(1);
  }
}

sendPhoto();
