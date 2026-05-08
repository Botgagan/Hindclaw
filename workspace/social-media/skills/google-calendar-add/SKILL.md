# google-calendar-add Skill

## Purpose
Create a Google Calendar event when a social media post is scheduled. This allows tracking post schedules in Google Calendar.

## When to Use
After Step 9 (scheduling details collected) - automatically called by the workflow.

## Input Parameters
- `BRAND`: Brand/community name (e.g., "BAPS Community")
- `CAPTION`: Post caption/text
- `PLATFORM`: Platform (e.g., "Instagram", "Facebook")
- `DATETIME`: ISO datetime (e.g., "2026-05-02T18:00:00+05:30")
- `TIMEZONE`: Timezone (e.g., "Asia/Kolkata")

## Usage
```bash
node skills/google-calendar-add/scripts/add_event.js "Brand" "Caption" "Platform" "2026-05-02T18:00:00+05:30" "Asia/Kolkata"
```

## Setup Required
1. OAuth2 credentials already configured
2. Refresh token already obtained via get_token.sh
3. tokens.env file contains valid refresh_token

## Output
Returns event link in format:
```
OK: https://www.google.com/calendar/event?eid=...
```

## Example
```
node skills/google-calendar-add/scripts/add_event.js "BAPS Community" "Janmashtami celebration post" "Instagram" "2026-05-02T18:00:00+05:30" "Asia/Kolkata"
```

This creates a calendar event with:
- Title: "BAPS Community - Scheduled Post"
- Description: Full post details with platform and time
