# facebook-dms Skill

## Purpose
Fetch new direct messages (DMs) from Facebook Page and auto-reply to them.

## When to Use
Part of ENGAGEMENT.md workflow - runs every 1 hour via heartbeat.

## Input Parameters
- `ACCESS_TOKEN`: Facebook Page Access Token

## Usage
```bash
node skills/facebook-dms/scripts/fetch_dms.js
```

## Output
- Array of new conversations with: conversation_id, messages, from
- Replies sent to each DM

## Configuration
Create `facebook_dms_config.env`:
```
FB_PAGE_ACCESS_TOKEN=your_token_here
```

## API Endpoint
GET `/me/conversations?fields=messages{message,from,created_time}&access_token={TOKEN}`