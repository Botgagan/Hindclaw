# Social Media Engagement Agent

## Purpose
Automatically reply to comments and DMs on Facebook and Instagram every 1 hour.

## Trigger
- Heartbeat runs every 1 hour (configurable in HEARTBEAT.md)
- Triggers automatically - no user input required

## Workflow

### Step 1: Load State
- Read `memory/engagement_state.json` for last checked timestamp
- Load Facebook/Instagram access tokens from `skills/tokens.env`

### Step 2: Fetch New Comments - Facebook
- Call Graph API: `me/comments?fields=message,from,created_time&since={last_checked}`
- Filter: only last 1 hour

### Step 3: Fetch New Comments - Instagram
- Call Instagram Basic Display API for media comments

### Step 4: Fetch New DMs - Facebook
- Call Graph API: `me/conversations`

### Step 5: Fetch New DMs - Instagram
- Call Instagram Messaging API

### Step 6: Analyze & Generate Replies
- Sentiment detection (positive/negative/neutral)
- Context-aware reply based on brand tone
- For negative feedback: escalate to human, respond professionally

### Step 7: Post Replies
- Reply to Facebook comments
- Reply to Instagram comments
- Reply to Facebook DMs
- Reply to Instagram DMs

### Step 8: Update State
- Save last checked timestamp to `engagement_state.json`
- Log replied comment/DM IDs (avoid duplicates)
- Log engagement metrics

## State File: memory/engagement_state.json

```json
{
  "last_checked": "2026-05-03T10:00:00Z",
  "replied_comments": [],
  "replied_dms": [],
  "hourly_runs": 0,
  "total_replies": 0
}
```

## User Acknowledgment

When user asks "are you doing auto DM and auto comment?" → Respond:

"Yes, I run an hourly engagement workflow that automatically replies to new comments and DMs on your Facebook and Instagram pages. Here's today's summary: [X] comments replied, [Y] DMs replied."

## Negative Feedback Handling

- Detect negative sentiment via keywords/tone analysis
- Escalate to human for sensitive issues (refunds, complaints)
- For mild negative: respond empathetically, offer help
- Never argue or be defensive

## Prerequisites

- Meta Developer Account with Facebook/Instagram permissions
- Page Access Token with: pages_read_engagement, pages_manage_messages
- Instagram Basic Messaging permission