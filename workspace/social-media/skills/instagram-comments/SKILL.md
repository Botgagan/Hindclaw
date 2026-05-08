# instagram-comments Skill

## Purpose
Fetch new comments from Instagram posts and auto-reply to them.

## When to Use
Part of ENGAGEMENT.md workflow - runs every 1 hour via heartbeat.

## Input Parameters
- `ACCESS_TOKEN`: Instagram Basic Display Access Token

## Usage
```bash
node skills/instagram-comments/scripts/fetch_comments.js
```

## Output
- Array of new comments with: comment_id, text, username, timestamp
- Replies sent to each comment

## Configuration
Create `instagram_comments_config.env`:
```
IG_ACCESS_TOKEN=your_token_here
```

## API Endpoint
GET `https://graph.instagram.com/me/media?fields=comments&access_token={TOKEN}`