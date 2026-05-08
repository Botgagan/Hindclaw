#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../instagram_comments_config.env');
const STATE_PATH = path.join(__dirname, '../../memory/engagement_state.json');

function loadConfig() {
  const config = {};
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    data.split('\n').forEach(line => {
      const [key, ...val] = line.split('=');
      if (key && val.length) config[key.trim()] = val.join('=').trim();
    });
  } catch(e) {
    console.log('Error: Config file not found. Create instagram_comments_config.env');
    process.exit(1);
  }
  return config;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch(e) {
    return { replied_comments: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function apiRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function analyzeSentiment(message) {
  const negative = ['bad', 'worst', 'hate', 'angry', 'disappointed', 'refund', 'complaint', 'terrible', 'poor', 'useless'];
  const positive = ['great', 'awesome', 'love', 'amazing', 'thank', 'thanks', 'good', 'best', 'wonderful', 'happy'];
  
  const lower = message.toLowerCase();
  if (negative.some(w => lower.includes(w))) return 'negative';
  if (positive.some(w => lower.includes(w))) return 'positive';
  return 'neutral';
}

function generateReply(message, sentiment) {
  const positiveReplies = [
    "Thank you so much! 😊💖",
    "We appreciate your support! 🌟",
    "Thanks for the love! 🙌",
    "So glad you liked it! ❤️"
  ];
  
  const neutralReplies = [
    "Thanks for your comment!",
    "Thanks for connecting with us!",
    "We appreciate your feedback!"
  ];
  
  const negativeReplies = [
    "We're sorry to hear that. Please DM us so we can help!",
    "We apologize for any inconvenience. Let's make it right!"
  ];
  
  if (sentiment === 'negative') return negativeReplies[Math.floor(Math.random() * negativeReplies.length)];
  if (sentiment === 'positive') return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  return neutralReplies[Math.floor(Math.random() * neutralReplies.length)];
}

async function fetchAndReply() {
  const config = loadConfig();
  const state = loadState();
  
  if (!config.IG_ACCESS_TOKEN) {
    console.log('Error: Missing IG_ACCESS_TOKEN');
    process.exit(1);
  }
  
  console.log('Fetching Instagram comments...');
  
  try {
    const mediaData = await apiRequest(`https://graph.instagram.com/me/media?fields=id,comments&access_token=${config.IG_ACCESS_TOKEN}`);
    
    if (!mediaData.data || mediaData.data.length === 0) {
      console.log('No media found.');
      return;
    }
    
    let replied = 0;
    
    for (const media of mediaData.data) {
      if (!media.comments || !media.comments.data) continue;
      
      for (const comment of media.comments.data) {
        if (state.replied_comments.includes(comment.id)) continue;
        
        const sentiment = analyzeSentiment(comment.text);
        const reply = generateReply(comment.text, sentiment);
        
        try {
          await apiRequest(`https://graph.instagram.com/${comment.id}/replies?message=${encodeURIComponent(reply)}&access_token=${config.IG_ACCESS_TOKEN}`);
          state.replied_comments.push(comment.id);
          state.today_comments_replied = (state.today_comments_replied || 0) + 1;
          state.total_replies = (state.total_replies || 0) + 1;
          replied++;
          console.log(`✓ Replied to comment from @${comment.username}`);
        } catch(e) {
          console.log(`✗ Failed to reply to ${comment.id}: ${e.message}`);
        }
      }
    }
    
    saveState(state);
    console.log(`\nSummary: ${replied} Instagram comments replied to.`);
  } catch(e) {
    console.log('Error fetching comments:', e.message);
    process.exit(1);
  }
}

fetchAndReply();