#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const https = require("https");

const SCRIPTS_DIR = __dirname;
const WORKSPACE_DIR = path.resolve(SCRIPTS_DIR, "..", "..", "..");
const STATE_FILE = path.join(WORKSPACE_DIR, "memory", "scheduled_posts_state.json");
const TOKENS_FILE = path.join(SCRIPTS_DIR, "tokens.env");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET";

function parseEnvFile(filePath) {
  const cfg = {};
  if (!fs.existsSync(filePath)) return cfg;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith("#") || !cleaned.includes("=")) continue;
    const [k, ...rest] = cleaned.split("=");
    cfg[k.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
  return cfg;
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { posted_events: [], posted_event_details: [], last_check: null };
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (!Array.isArray(state.posted_events)) state.posted_events = [];
    if (!Array.isArray(state.posted_event_details)) state.posted_event_details = [];
    return state;
  } catch {
    return { posted_events: [], posted_event_details: [], last_check: null };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function httpsJson({ hostname, path: reqPath, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: reqPath, method, headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        const status = res.statusCode || 0;
        let parsed = null;
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          return reject(new Error(`Invalid JSON response (${status}): ${raw}`));
        }
        if (status >= 200 && status < 300) return resolve(parsed);
        reject(new Error(parsed?.error?.message || raw || `HTTP ${status}`));
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function parsePlatform(desc) {
  const m = (desc || "").match(/PLATFORM:\s*([^|]+)/i);
  const value = (m ? m[1] : "Facebook").trim();
  if (/both/i.test(value)) return "Both";
  if (/instagram/i.test(value)) return "Instagram";
  return "Facebook";
}

function parseCaption(desc) {
  const m = (desc || "").match(/CAPTION:\s*([^|]+)/i);
  return m ? m[1].trim() : "";
}

function parseImagePath(desc) {
  const m = (desc || "").match(/IMAGE:\s*([^|]+)/i);
  return m ? m[1].trim() : "";
}

function resolveImagePath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p.trim();
  const raw = p.trim();
  const basename = path.basename(raw);
  const candidates = [
    raw,
    path.isAbsolute(raw) ? raw : path.join(WORKSPACE_DIR, raw),
    path.join(WORKSPACE_DIR, "generated", "images", basename),
    path.join(WORKSPACE_DIR, "generated", "images", raw),
    "/home/node/.openclaw/workspace/social-media/generated/images/" + basename,
    "C:\\Users\\Gagandeep Saini\\.openclaw\\workspace\\social-media\\generated\\images\\" + basename,
    "/home/node/.openclaw/workspace/social-media/" + raw,
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch(e) {}
  }
  return null;
}

function loadRefreshToken() {
  const data = parseEnvFile(TOKENS_FILE);
  return data.REFRESH_TOKEN || "";
}

async function getGoogleAccessToken() {
  const refreshToken = loadRefreshToken();
  if (!refreshToken) throw new Error("Missing REFRESH_TOKEN in tokens.env");
  const body = JSON.stringify({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const resp = await httpsJson({
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!resp.access_token) throw new Error("Google token response missing access_token");
  return resp.access_token;
}

async function fetchDueEvents() {
  const token = await getGoogleAccessToken();
  const now = new Date();
  const max = new Date(now.getTime() + 30 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: max.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    q: "Post",
  });
  const data = await httpsJson({
    hostname: "www.googleapis.com",
    path: `/calendar/v3/calendars/primary/events?${params.toString()}`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const items = Array.isArray(data.items) ? data.items : [];
  const nowMs = Date.now();

  return items
    .filter((e) => e?.id && e?.start?.dateTime)
    .map((e) => {
      const description = e.description || "";
      return {
        id: e.id,
        title: e.summary || "Scheduled Post",
        eventTime: e.start.dateTime,
        platform: parsePlatform(description),
        caption: parseCaption(description),
        imagePath: parseImagePath(description),
      };
    })
    .filter((e) => {
      const t = new Date(e.eventTime).getTime();
      return !Number.isNaN(t) && t >= nowMs && t - nowMs <= 30 * 60 * 1000;
    });
}

function loadFacebookConfig() {
  const cfg = parseEnvFile(path.join(WORKSPACE_DIR, "skills", "facebook-post", "scripts", "facebook_config.env"));
  return {
    token: process.env.FB_PAGE_ACCESS_TOKEN || cfg.FB_PAGE_ACCESS_TOKEN || cfg.PAGE_ACCESS_TOKEN || "",
    pageId: process.env.FB_PAGE_ID || cfg.FB_PAGE_ID || cfg.PAGE_ID || "",
  };
}

function loadInstagramConfig() {
  const cfg = parseEnvFile(path.join(WORKSPACE_DIR, "skills", "instagram-post", "scripts", "instagram_config.env"));
  return { token: process.env.IG_ACCESS_TOKEN || cfg.IG_ACCESS_TOKEN || "" };
}

async function postFacebook(caption, imageUrlOrPath) {
  const cfg = loadFacebookConfig();
  if (!cfg.token || !cfg.pageId) throw new Error("Facebook credentials missing");
  const image = String(imageUrlOrPath || "").trim();
  if (/^https?:\/\//i.test(image)) {
    const body = JSON.stringify({ url: image, caption, access_token: cfg.token });
    const resp = await httpsJson({
      hostname: "graph.facebook.com",
      path: `/${cfg.pageId}/photos`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      body,
    });
    return resp.id || "";
  }

  if (!fs.existsSync(image)) throw new Error("Local image file not found for Facebook upload");
  const fileBuffer = fs.readFileSync(image);
  const boundary = `----OpenClawBoundary${Date.now()}`;
  const eol = "\r\n";
  const partCaption =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="caption"${eol}${eol}` +
    `${caption}${eol}`;
  const partToken =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="access_token"${eol}${eol}` +
    `${cfg.token}${eol}`;
  const partFileHeader =
    `--${boundary}${eol}` +
    `Content-Disposition: form-data; name="source"; filename="${path.basename(image)}"${eol}` +
    `Content-Type: image/png${eol}${eol}`;
  const end = `${eol}--${boundary}--${eol}`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(partCaption, "utf8"),
    Buffer.from(partToken, "utf8"),
    Buffer.from(partFileHeader, "utf8"),
    fileBuffer,
    Buffer.from(end, "utf8"),
  ]);

  const resp = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "graph.facebook.com",
        path: `/${cfg.pageId}/photos`,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": bodyBuffer.length,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};
            if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300) return resolve(parsed);
            reject(new Error(parsed?.error?.message || raw || `HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(raw || "Invalid Facebook response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyBuffer);
    req.end();
  });
  return resp.id || "";
}

async function postInstagram(caption, imageUrlOrPath) {
  const cfg = loadInstagramConfig();
  if (!cfg.token) throw new Error("Instagram credentials missing");

  const createBody = JSON.stringify({ image_url: imageUrlOrPath, caption, access_token: cfg.token });
  const container = await httpsJson({
    hostname: "graph.instagram.com",
    path: "/me/media",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(createBody) },
    body: createBody,
  });

  if (!container.id) throw new Error("Instagram container creation failed");
  const publishBody = JSON.stringify({ creation_id: container.id, access_token: cfg.token });
  const published = await httpsJson({
    hostname: "graph.instagram.com",
    path: "/me/media_publish",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(publishBody) },
    body: publishBody,
  });
  return published.id || "";
}

async function main() {
  const state = loadState();
  const dueEvents = await fetchDueEvents();
  if (!dueEvents.length) {
    state.last_check = new Date().toISOString();
    saveState(state);
    console.log("NO_DUE_EVENTS");
    return;
  }

  for (const event of dueEvents) {
    if (state.posted_events.includes(event.id)) continue;
    const caption = event.caption || "Scheduled post";
    const resolvedImage = resolveImagePath(event.imagePath);
    if (!resolvedImage) {
      console.log(`SKIP_EVENT_NO_IMAGE: ${event.id}`);
      continue;
    }

    let posted = false;
    if (event.platform === "Facebook" || event.platform === "Both") {
      try {
        await postFacebook(caption, resolvedImage);
        posted = true;
      } catch (e) {
        console.log(`FACEBOOK_POST_ERROR ${event.id}: ${e.message}`);
      }
    }
    if (event.platform === "Instagram" || event.platform === "Both") {
      try {
        await postInstagram(caption, resolvedImage);
        posted = true;
      } catch (e) {
        console.log(`INSTAGRAM_POST_ERROR ${event.id}: ${e.message}`);
      }
    }

    if (posted) {
      state.posted_events.push(event.id);
      state.posted_event_details.push({
        id: event.id,
        title: event.title,
        platform: event.platform,
        caption,
        image_path: event.imagePath,
        posted_at: new Date().toISOString(),
      });
      console.log(`POSTED_EVENT: ${event.id}`);
    }
  }

  state.last_check = new Date().toISOString();
  saveState(state);
  console.log("DONE");
}

main().catch((e) => {
  console.log("ERROR:", e.message);
  process.exit(1);
});
