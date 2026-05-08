#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);

let imagePath = null;
let postText = null;
let hashtags = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--image-path' && args[i + 1]) {
    imagePath = args[i + 1];
    i++;
  } else if (args[i] === '--post-text' && args[i + 1]) {
    postText = args[i + 1];
    i++;
  } else if (args[i] === '--hashtags' && args[i + 1]) {
    hashtags = args[i + 1];
    i++;
  }
}

if (!imagePath || !postText) {
  console.error('ERROR: Missing required parameters');
  console.error('Usage: node display_card.mjs --image-path "<PATH>" --post-text "<TEXT>" [--hashtags "<TAGS>"]');
  process.exit(1);
}

const imagePathNormalized = imagePath.replace(/\\/g, '/').replace(/C:/i, '');

let imageBase64 = null;
let imageMimeType = 'image/png';

try {
  const absolutePath = imagePath.startsWith('/') ? imagePath : join(__dirname, '..', '..', imagePath);
  const imageBuffer = readFileSync(absolutePath);
  imageBase64 = imageBuffer.toString('base64');
  
  if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
    imageMimeType = 'image/jpeg';
  } else if (imagePath.toLowerCase().endsWith('.gif')) {
    imageMimeType = 'image/gif';
  } else if (imagePath.toLowerCase().endsWith('.webp')) {
    imageMimeType = 'image/webp';
  }
} catch (err) {
  console.error('WARNING: Could not read image file:', err.message);
}

const cardOutput = `
## 📱 Visual Card Preview

**Image:**
${imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : imagePathNormalized}

**Caption:**
${postText}

${hashtags ? `**Hashtags:**\n${hashtags}` : ''}

---

**Please review your post card above.** 

- Type **Approve** to continue to platform selection
- Type **Reject** to go back to asset selection

---

**Image Path:** ${imagePathNormalized}
`;

console.log(cardOutput);