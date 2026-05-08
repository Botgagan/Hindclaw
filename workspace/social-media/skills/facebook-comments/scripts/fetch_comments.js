#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../facebook_comments_config.env');
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
    console.log('Error: Config file not found. Create facebook_comments_config.env');
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
    "Thank you so much for your kind words! 😊",
    "We appreciate your support! 💖",
    "Thanks for the love! 🌟",
    "So glad you enjoyed it! 🙌"
  ];
  
  const neutralReplies = [
    "Thanks for your comment!",
    "We appreciate your feedback!",
    "Thanks for connecting with us!"
  ];
  
  const negativeReplies = [
    "We're sorry to hear that. We'd love to know more about how we can help. Please DM us.",
    "We apologize for any inconvenience. Please reach out to us directly so we can assist."
  ];
  
  if (sentiment === 'negative') return negativeReplies[Math.floor(Math.random() * negativeReplies.length)];
  if (sentiment === 'positive') return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  return neutralReplies[Math.floor(Math.random() * neutralReplies.length)];
}

async function fetchAndReply() {
  const config = loadConfig();
  const state = loadState();
  const since = process.argv[2] || state.last_checked || new Date(Date.now() - 3600000).toISOString();
  
  if (!config.FB_PAGE_ACCESS_TOKEN || !config.FB_PAGE_ID) {
    console.log('Error: Missing FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID');
    process.exit(1);
  }
  
  console.log(`Fetching Facebook comments since ${since}...`);
  
  try {
    const data = await apiRequest(`/${config.FB_PAGE_ID}/comments?fields=message,from,created_time&since=${since}&access_token=${config.FB_PAGE_ACCESS_TOKEN}`);
    
    if (!data.data || data.data.length === 0) {
      console.log('No new comments found.');
      return;
    }
    
    console.log(`Found ${data.data.length} new comments.`);
    let replied = 0;
    
    for (const comment of data.data) {
      if (state.replied_comments.includes(comment.id)) continue;
      
      const sentiment = analyzeSentiment(comment.message);
      const reply = generateReply(comment.message, sentiment);
      
      try {
        await apiRequest(`/${comment.id}/comments?message=${encodeURIComponent(reply)}&access_token=${config.FB_PAGE_ACCESS_TOKEN}`);
        state.replied_comments.push(comment.id);
        state.today_comments_replied = (state.today_comments_replied || 0) + 1;
        state.total_replies = (state.total_replies || 0) + 1;
        replied++;
        console.log(`✓ Replied to comment from ${comment.from?.name || 'user'}`);
      } catch(e) {
        console.log(`✗ Failed to reply to ${comment.id}: ${e.message}`);
      }
    }
    
    state.last_checked = new Date().toISOString();
    state.hourly_runs = (state.hourly_runs || 0) + 1;
    saveState(state);
    
    console.log(`\nSummary: ${replied} comments replied to.`);
  } catch(e) {
    console.log('Error fetching comments:', e.message);
    process.exit(1);
  }
}

fetchAndReply();