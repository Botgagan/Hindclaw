# telegram-send-photo Skill

## Purpose
Send a generated image to Telegram so users can see it directly in their Telegram chat.

## When to Use
After image generation (Step 7) and before asking for user approval - display the image in Telegram so user can see and decide whether to approve or reject.

## Input Parameters
- `image-path`: Path to the generated image file
- `caption`: Post text/caption to include with the image
- `chat-id`: Telegram chat ID (optional - will use user's chat ID if not provided)

## How It Works
1. Reads the image file from the path
2. Sends the image to Telegram using the Bot API
3. Returns confirmation with message_id

## Usage
```bash
node skills/telegram-send-photo/scripts/send_photo.mjs --image-path "generated/images/image.png" --caption "Your post caption here"
```

## Telegram Bot API
Uses: `https://api.telegram.org/bot<TOKEN>/sendPhoto`

## Output
Returns JSON with:
- success: true/false
- message_id: Telegram message ID
- chat_id: Chat where sent

## Example
```
node skills/telegram-send-photo/scripts/send_photo.mjs --image-path "generated/images/openrouter-image-2026-04-29T06-19-28-207Z.png" --caption "Renewable Energy Solutions - Discover how to harness clean, sustainable power..."
```

## Dependencies
- Node.js
- Telegram Bot Token (configured in OpenClaw)
- Image file must exist

## Error Handling
- If image not found: Return error message
- If Telegram API fails: Return error details
