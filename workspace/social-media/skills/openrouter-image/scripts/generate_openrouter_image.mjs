#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash-image";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
  const args = {
    prompt: "",
    model: DEFAULT_MODEL,
    aspectRatio: "1:1",
    imageSize: "1K",
    outputDir: path.join(workspaceRoot, "generated", "images"),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    const b = argv[i + 1];
    if (a === "--prompt" && b) {
      args.prompt = b;
      i += 1;
    } else if (a === "--model" && b) {
      args.model = b;
      i += 1;
    } else if (a === "--aspect-ratio" && b) {
      args.aspectRatio = b;
      i += 1;
    } else if (a === "--image-size" && b) {
      args.imageSize = b;
      i += 1;
    } else if (a === "--output-dir" && b) {
      args.outputDir = path.isAbsolute(b) ? b : path.resolve(workspaceRoot, b);
      i += 1;
    }
  }
  return args;
}

function loadOpenRouterKey() {
  const envKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (envKey) return envKey;

  const profilePath = path.join(
    os.homedir(),
    ".openclaw",
    "agents",
    "social-media",
    "agent",
    "auth-profiles.json"
  );

  if (fs.existsSync(profilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      const key = data?.profiles?.["openrouter:default"]?.key?.trim();
      if (key) return key;
    } catch {
      // ignore and continue to throw explicit error below
    }
  }

  throw new Error(
    "OPENROUTER_API_KEY not found. Set env OPENROUTER_API_KEY or configure ~/.openclaw/agents/social-media/agent/auth-profiles.json"
  );
}

function extractImageRef(json) {
  const msg = json?.choices?.[0]?.message ?? {};
  const first = (msg.images || [])[0];
  if (!first) {
    throw new Error("No images returned by OpenRouter.");
  }

  const candidates = [
    first?.image_url?.url,
    first?.imageUrl?.url,
    first?.url,
    first?.data,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  throw new Error("Image payload was returned but no usable URL/data found.");
}

function decodeDataUrl(dataUrl) {
  const marker = "base64,";
  const idx = dataUrl.indexOf(marker);
  if (idx === -1) throw new Error("Invalid data URL image payload.");
  const b64 = dataUrl.slice(idx + marker.length);
  return Buffer.from(b64, "base64");
}

async function saveImage(imageRef, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `openrouter-image-${stamp}.png`;
  const filePath = path.join(outputDir, fileName);

  let finalPath;
  if (imageRef.startsWith("data:image")) {
    const buf = decodeDataUrl(imageRef);
    fs.writeFileSync(filePath, buf);
    finalPath = filePath;
  } else {
    const res = await fetch(imageRef);
    if (!res.ok) {
      throw new Error(`Failed to download generated image URL (${res.status})`);
    }
    const arr = new Uint8Array(await res.arrayBuffer());
    fs.writeFileSync(filePath, Buffer.from(arr));
    finalPath = filePath;
  }
  return {
    absolutePath: finalPath,
    relativePath: path.join("generated", "images", fileName).replace(/\\/g, "/"),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.prompt) {
    throw new Error("Missing required --prompt");
  }

  const apiKey = loadOpenRouterKey();
  const payload = {
    model: args.model,
    modalities: ["image", "text"],
    messages: [{ role: "user", content: args.prompt }],
    stream: false,
    image_config: {
      aspect_ratio: args.aspectRatio,
      image_size: args.imageSize,
    },
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://openclaw.ai",
      "X-Title": "OpenClaw Social Media Agent",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${detail}`);
  }

  const body = await res.json();
  const imageRef = extractImageRef(body);
  const saved = await saveImage(imageRef, args.outputDir);

  process.stdout.write(
    JSON.stringify(
      {
        status: "ok",
        model: args.model,
        aspect_ratio: args.aspectRatio,
        image_size: args.imageSize,
        image_path: saved.relativePath,
        absolute_path: saved.absolutePath,
      },
      null,
      0
    )
  );
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ status: "error", error: String(err.message || err) }));
  process.exit(1);
});
