#!/usr/bin/env node
// Instagram Auto-Post Script

const https = require('https');
const fs = require('fs');

// Load config
let CONFIG = {};
try {
  const data = fs.readFileSync('./instagram_config.env', 'utf8');
  data.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) CONFIG[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  });
} catch(e) {}

// Environment variables override file
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || CONFIG.IG_ACCESS_TOKEN;
const IMAGE_URL = process.env.IG_IMAGE_URL || CONFIG.IG_IMAGE_URL;

// Args
const CAPTION = process.argv[2] || process.env.POST_CAPTION || "Posted via Auto";
const IMAGE_LINK = process.argv[3] || IMAGE_URL;

if (!ACCESS_TOKEN) {
  console.log("Error: IG_ACCESS_TOKEN required");
  console.log("Usage: node post_instagram.js 'Caption' 'ImageURL'");
  console.log("Or set environment variable IG_ACCESS_TOKEN");
  process.exit(1);
}

async function postToInstagram() {
  // Step 1: Create media container
  const containerData = JSON.stringify({
    image_url: IMAGE_LINK,
    caption: CAPTION,
    access_token: ACCESS_TOKEN
  });

  const containerId = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.instagram.com',
      path: '/me/media',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(containerData)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.id) resolve(r.id);
        else reject(new Error(body));
      });
    });
    req.on('error', reject);
    req.write(containerData);
    req.end();
  });

  console.log('📦 Container created. ID:', containerId);

  // Step 2: Publish the media
  const publishData = JSON.stringify({
    creation_id: containerId,
    access_token: ACCESS_TOKEN
  });

  const result = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.instagram.com',
      path: '/me/media_publish',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(publishData)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.id) resolve(r);
        else reject(new Error(body));
      });
    });
    req.on('error', reject);
    req.write(publishData);
    req.end();
  });

  return result;
}

postToInstagram()
  .then(r => {
    console.log('✅ Posted to Instagram successfully!');
    console.log('📝 Post ID:', r.id);
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });