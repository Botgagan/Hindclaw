#!/usr/bin/env node
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8742627208:AAEncIreXqStIdOebX3Hcf_khQ2Du1N6c2A";

const args = process.argv.slice(2);
let text = "";
let options = "";
let columns = 2;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--text" && args[i + 1]) text = args[++i];
  if (args[i] === "--options" && args[i + 1]) options = args[++i];
  if (args[i] === "--columns" && args[i + 1]) columns = parseInt(args[++i]);
}

if (!text || !options) {
  console.log("Usage: node send_buttons.js --text 'Question?' --options 'Label:value|Label:value' [--columns 2]");
  process.exit(1);
}

const optionParts = options.split("|");
const buttons = [];

for (let i = 0; i < optionParts.length; i += columns) {
  const row = optionParts.slice(i, i + columns).map(opt => {
    const [label, value] = opt.split(":");
    return { text: label.trim(), callback_data: value.trim() };
  });
  buttons.push(row);
}

const keyboard = JSON.stringify({ inline_keyboard: buttons });
const data = JSON.stringify({
  chat_id: process.env.TELEGRAM_CHAT_ID || "6002828622",
  text: text,
  reply_markup: keyboard
});

const req = https.request({
  hostname: "api.telegram.org",
  path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
  method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
}, (res) => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    const result = JSON.parse(body);
    if (result.ok) console.log("Buttons sent!");
    else console.log("Error:", result.description);
  });
});

req.on("error", e => console.log("Error:", e.message));
req.write(data);
req.end();