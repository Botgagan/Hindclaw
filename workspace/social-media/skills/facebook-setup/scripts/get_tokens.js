#!/usr/bin/env node
// Facebook & Instagram OAuth Token Setup
// Run: node skills/facebook-setup/scripts/get_tokens.js

const https = require('https');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Load credentials
let creds = { FB_APP_ID: '', FB_APP_SECRET: '' };
try {
  const data = fs.readFileSync('./skills/facebook-credentials.env', 'utf8');
  data.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) creds[key.trim()] = val.join('=').trim();
  });
} catch(e) {}

if (!creds.FB_APP_ID || !creds.FB_APP_SECRET) {
  console.log('Error: App ID and Secret required');
  process.exit(1);
}

const APP_ID = creds.FB_APP_ID;
const APP_SECRET = creds.FB_APP_SECRET;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Facebook/Instagram Token Setup                    ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('Step 1: Authenticate User\n');
console.log(`Open this URL in browser and grant permissions:`);
console.log(`https://www.facebook.com/v18.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=https://localhost&scope=pages_manage_posts,pages_show_list,instagram_basic,instagram_manage_media&response_type=code`);
console.log('\nAfter authorization, you will be redirected to localhost.');
console.log('Copy the CODE parameter from the URL.\n');

rl.question('Paste the CODE from URL: ', (code) => {
  if (!code) { console.log('Code required'); process.exit(1); }
  
  const data = JSON.stringify({ code, redirect_uri: 'https://localhost', client_id: APP_ID, client_secret: APP_SECRET, grant_type: 'authorization_code' });
  
  const req = https.request({
    hostname: 'graph.facebook.com',
    path: '/v18.0/oauth/access_token',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      try {
        const r = JSON.parse(body);
        if (r.access_token) {
          console.log('\n✅ Access Token obtained!');
          fs.appendFileSync('./skills/tokens.env', `\nFB_ACCESS_TOKEN=${r.access_token}\nIG_ACCESS_TOKEN=${r.access_token}\n`);
          console.log('Token saved to skills/tokens.env');
        } else {
          console.log('\n❌ Error:', body);
        }
      } catch(e) { console.log('\n❌ Error:', e.message); }
    });
  });
  req.on('error', e => console.log('\n❌ Error:', e.message));
  req.write(data);
  req.end();
});