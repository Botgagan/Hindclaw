# HEARTBEAT.md - Social Media Agent Checks

Return HEARTBEAT_OK when nothing needs attention.

## Calendar Post Check (Every 5 Minutes)

- Run `node skills/google-calendar-add/scripts/post_from_calendar.js` to:
  - Query Google Calendar for events in next 30 minutes
  - Filter events with "Post" in title
  - Check `memory/scheduled_posts_state.json` and skip already-posted event IDs
  - Post to Facebook if event is due
  - Mark event as posted in state to avoid duplicates
- Treat run as successful only when output is either:
  - `NO_DUE_EVENTS`, or
  - one or more `POSTED_EVENT:` lines followed by `DONE`

## Hourly Engagement Check (Every 1 Hour)

- Run ENGAGEMENT.md workflow to check for new comments/DMs
- Read `memory/engagement_state.json` for last checked timestamp
- Fetch new comments from Facebook and Instagram
- Fetch new DMs from both platforms
- Auto-reply to new comments and DMs
- Update engagement state after each run

## Periodic Checks

- Pending approvals waiting for user input.
- Scheduled posts needing reconfirmation after changes.
- Calendar entries missing date, time, or platform details.