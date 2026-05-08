#!/usr/bin/env node
// Facebook Page Auto-Post Script

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load config
let CONFIG = {};
try {
  const configPath = path.join(__dirname, 'facebook_config.env');
  const data = fs.readFileSync(configPath, 'utf8');
  data.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) CONFIG[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  });
} catch (e) {}

// Environment variables override file
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || CONFIG.FB_PAGE_ACCESS_TOKEN || CONFIG.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FB_PAGE_ID || CONFIG.FB_PAGE_ID || CONFIG.PAGE_ID;
const IMAGE_URL = process.env.FB_IMAGE_URL || CONFIG.IMAGE_URL;

// Args
const CAPTION = process.argv[2] || process.env.POST_CAPTION || 'Posted via Auto';
const IMAGE_LINK = process.argv[3] || IMAGE_URL;

if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
  console.log('Error: FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID required');
  console.log("Usage: node post_facebook.js 'Caption' 'ImageURL-or-local-path'");
  console.log('Or set environment variables FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID');
  process.exit(1);
}

if (!IMAGE_LINK) {
  console.log('Error: Image URL or local image path required');
  console.log("Usage: node post_facebook.js 'Caption' 'ImageURL-or-local-path'");
  process.exit(1);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function resolveLocalImagePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw;

  const candidates = [
    path.resolve(process.cwd(), raw),
    path.resolve(__dirname, raw),
    path.resolve(__dirname, '..', '..', '..', raw),
    path.resolve(__dirname, '..', '..', '..', 'generated', 'images', path.basename(raw)),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function parseGraphResponse(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(body || 'Invalid Facebook response');
  }
}

function postPhotoByUrl(imageUrl) {
  const mediaData = JSON.stringify({
    url: imageUrl,
    caption: CAPTION,
    access_token: PAGE_ACCESS_TOKEN,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${PAGE_ID}/photos`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(mediaData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const r = parseGraphResponse(body);
          if (r.id) resolve(r.id);
          else reject(new Error(body));
        });
      }
    );
    req.on('error', reject);
    req.write(mediaData);
    req.end();
  });
}

function postPhotoByFile(localPath) {
  const fileBuffer = fs.readFileSync(localPath);
  const boundary = `----OpenClawBoundary${Date.now()}`;
  const eol = '\r\n';

  const partCaption =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="caption"${eol}${eol}` +
    `${CAPTION}${eol}`;

  const partToken =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="access_token"${eol}${eol}` +
    `${PAGE_ACCESS_TOKEN}${eol}`;

  const partFileHeader =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="source"; filename="${path.basename(localPath)}"${eol}` +
    `Content-Type: image/png${eol}${eol}`;

  const end = `${eol}--${boundary}--${eol}`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(partCaption, 'utf8'),
    Buffer.from(partToken, 'utf8'),
    Buffer.from(partFileHeader, 'utf8'),
    fileBuffer,
    Buffer.from(end, 'utf8'),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${PAGE_ID}/photos`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const r = parseGraphResponse(body);
          if (r.id) resolve(r.id);
          else reject(new Error(body));
        });
      }
    );
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function postToFacebook() {
  let mediaId;

  if (isHttpUrl(IMAGE_LINK)) {
    mediaId = await postPhotoByUrl(IMAGE_LINK);
  } else {
    const localPath = resolveLocalImagePath(IMAGE_LINK);
    if (!localPath) {
      throw new Error(`Image not found: ${IMAGE_LINK}`);
    }
    mediaId = await postPhotoByFile(localPath);
  }

  console.log('Photo uploaded. Media ID:', mediaId);
  console.log('Post URL: https://www.facebook.com/' + PAGE_ID);
  return { mediaId, pageId: PAGE_ID };
}

postToFacebook()
  .then(() => {
    console.log('Posted to Facebook successfully.');
  })
  .catch((err) => {
    console.log('Error:', err.message);
    process.exit(1);
  });
