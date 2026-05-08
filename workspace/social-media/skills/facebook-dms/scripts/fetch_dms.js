#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../facebook_dms_config.env');
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
    console.log('Error: Config file not found. Create facebook_dms_config.env');
    process.exit(1);
  }
  return config;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch(e) {
    return { replied_dms: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://graph.facebook.com/v18.0${path}`, (res) => {
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
    "Thank you so much for reaching out! 😊 How can I help you today?",
    "We really appreciate your message! 💖 What can we help you with?",
    "Thanks for contacting us! 🌟 Let us know how we can assist!"
  ];
  
  const neutralReplies = [
    "Thanks for your message! How can we help you today?",
    "We received your message! Let us know what you need.",
    "Thanks for reaching out! We're here to help."
  ];
  
  const negativeReplies = [
    "We're sorry to hear that. We're here to help! Please share more details so we can assist you better.",
    "We apologize for any inconvenience. Please let us know how we can make things right."
  ];
  
  if (sentiment === 'negative') return negativeReplies[Math.floor(Math.random() * negativeReplies.length)];
  if (sentiment === 'positive') return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  return neutralReplies[Math.floor(Math.random() * neutralReplies.length)];
}

async function fetchAndReplyDMs() {
  const config = loadConfig();
  const state = loadState();
  
  if (!config.FB_PAGE_ACCESS_TOKEN) {
    console.log('Error: Missing FB_PAGE_ACCESS_TOKEN');
    process.exit(1);
  }
  
  console.log('Fetching Facebook DMs...');
  
  try {
    const data = await apiRequest(`/me/conversations?fields=id,updated_time,messages{message,from,created_time}&access_token=${config.FB_PAGE_ACCESS_TOKEN}`);
    
    if (!data.data || data.data.length === 0) {
      console.log('No new conversations found.');
      return;
    }
    
    let replied = 0;
    
    for (const conv of data.data) {
      if (state.replied_dms.includes(conv.id)) continue;
      
      const messages = conv.messages?.data || [];
      const latestMsg = messages[messages.length - 1];
      
      if (!latestMsg || latestMsg.from.id === config.FB_PAGE_ID) continue;
      
      const sentiment = analyzeSentiment(latestMsg.message);
      const reply = generateReply(latestMsg.message, sentiment);
      
      try {
        await apiRequest(`/me/messages?recipient={id:${latestMsg.from.id}}&message=${encodeURIComponent(reply)}&access_token=${config.FB_PAGE_ACCESS_TOKEN}`);
        state.replied_dms.push(conv.id);
        state.today_dms_replied = (state.today_dms_replied || 0) + 1;
        state.total_replies = (state.total_replies || 0) + 1;
        replied++;
        console.log(`✓ Replied to DM from ${latestMsg.from?.name || 'user'}`);
      } catch(e) {
        console.log(`✗ Failed to reply to ${conv.id}: ${e.message}`);
      }
    }
    
    saveState(state);
    console.log(`\nSummary: ${replied} DMs replied to.`);
  } catch(e) {
    console.log('Error fetching DMs:', e.message);
    process.exit(1);
  }
}

fetchAndReplyDMs();