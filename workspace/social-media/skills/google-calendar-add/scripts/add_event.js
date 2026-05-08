const https = require("https");
const fs = require("fs");
const path = require("path");

const SCRIPTS_DIR = path.dirname(__filename);
const TOKENS_FILE = path.join(SCRIPTS_DIR, "tokens.env");

let REFRESH_TOKEN;
let FILE_CLIENT_ID;
let FILE_CLIENT_SECRET;
try {
  const data = fs.readFileSync(TOKENS_FILE, "utf8");
  let match = data.match(/REFRESH_TOKEN="([^"]+)"/);
  if (match) REFRESH_TOKEN = match[1];
  match = data.match(/CLIENT_ID="([^"]+)"/);
  if (match) FILE_CLIENT_ID = match[1];
  match = data.match(/CLIENT_SECRET="([^"]+)"/);
  if (match) FILE_CLIENT_SECRET = match[1];
} catch(e) { console.log("Error loading token:", e.message); process.exit(1); }
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || FILE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || FILE_CLIENT_SECRET || "";
const BRAND = process.argv[2] || "Brand";
const CAPTION = process.argv[3] || "Post";
const PLATFORM = process.argv[4] || "Facebook";
const DATETIME = process.argv[5] || "2026-05-02T18:00:00+05:30";
const IMAGE_PATH = process.argv[6] || "";
if (!REFRESH_TOKEN) { console.log("Token not set"); process.exit(1); }
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log("Google OAuth client credentials not set");
  process.exit(1);
}

const endDateTime = new Date(DATETIME);
endDateTime.setHours(endDateTime.getHours() + 1);
const endDateTimeStr = endDateTime.toISOString().replace(".000+0530", "+05:30");

const TIMEZONE = "Asia/Kolkata";
const description = "CAPTION: " + CAPTION + " | PLATFORM: " + PLATFORM + " | TIME: " + DATETIME + " | IMAGE: " + IMAGE_PATH;
const eventData = JSON.stringify({
  summary: BRAND + " - " + PLATFORM + " Post",
  description: description,
  start: { dateTime: DATETIME, timeZone: TIMEZONE },
  end: { dateTime: endDateTimeStr, timeZone: TIMEZONE }
});

const getToken = () => new Promise((resolve, reject) => {
  const req = https.request({
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, (res) => {
    let body = "";
    res.on("data", c => body += c);
    res.on("end", () => {
      try {
        resolve(JSON.parse(body).access_token);
      } catch(e) {
        reject(e);
      }
    });
  });
  req.on("error", reject);
  req.write(JSON.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: "refresh_token"
  }));
  req.end();
});

getToken().then(accessToken => {
  const req = https.request({
    hostname: "www.googleapis.com",
    path: "/calendar/v3/calendars/primary/events",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    }
  }, (res) => {
    let body = "";
    res.on("data", c => body += c);
    res.on("end", () => {
      try {
        const r = JSON.parse(body);
        if (r.id) {
          console.log("OK:", r.htmlLink);
        } else {
          console.log("ERR:", body);
        }
      } catch(e) {
        console.log("ERR:", e.message);
      }
    });
  });
  req.on("error", e => console.log("ERR:", e.message));
  req.write(eventData);
  req.end();
}).catch(e => console.log("ERR:", e.message));
