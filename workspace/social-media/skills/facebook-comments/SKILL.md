# facebook-comments Skill

## Purpose
Fetch new comments from Facebook Page and auto-reply to them.

## When to Use
Part of ENGAGEMENT.md workflow - runs every 1 hour via heartbeat.

## Input Parameters
- `SINCE`: Timestamp to fetch comments from (ISO 8601)
- `ACCESS_TOKEN`: Facebook Page Access Token
- `PAGE_ID`: Facebook Page ID

## Usage
```bash
node skills/facebook-comments/scripts/fetch_comments.js "2026-05-03T10:00:00Z"
```

## Output
- Array of new comments with: comment_id, message, from, created_time
- Replies sent to each comment

## Configuration
Create `facebook_comments_config.env`:
```
FB_PAGE_ACCESS_TOKEN=your_token_here
FB_PAGE_ID=your_page_id
```

## API Endpoint
GET `/{PAGE_ID}/comments?fields=message,from,created_time&since={SINCE}&access_token={TOKEN}`