const https = require('https');
const fs = require('fs');

const CLIENT_ID = process.argv[2] || process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.argv[3] || process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost";

console.log("Google OAuth Token Generator\n");

if (!process.argv[4]) {
  console.log("Usage: node get_token.js <client_id> <client_secret> <auth_code>");
  console.log("1. Go to this URL:");
  console.log(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent`);
  console.log("\n2. After authorizing, copy the code from the redirect URL");
  console.log("3. Run: node get_token.js <client_id> <client_secret> <code>");
  process.exit(1);
}

const authCode = process.argv[4];
console.log("Exchanging code for tokens...\n");

const postData = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${authCode}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}`;

const options = {
  hostname: 'oauth2.googleapis.com',
  port: 443,
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.refresh_token) {
        const content = `# Google Calendar OAuth Tokens
REFRESH_TOKEN="${result.refresh_token}"
CLIENT_ID="${CLIENT_ID}"
CLIENT_SECRET="${CLIENT_SECRET}"
`;
        fs.writeFileSync('tokens.env', content);
        console.log("SUCCESS! tokens.env created with new refresh token.");
      } else {
        console.log("Error:", result);
      }
    } catch (e) {
      console.log("Error parsing response:", data);
    }
  });
});

req.on('error', (e) => {
  console.log("Request error:", e.message);
});

req.write(postData);
req.end();