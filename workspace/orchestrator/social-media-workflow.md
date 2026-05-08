# Social Media Workflow Runtime Note

This file is a non-authoritative debug note.

- The source of truth for social media workflow behavior is:
  - `workspace/social-media/SOUL.md`
  - `workspace/social-media/HEARTBEAT.md`
- Never mark calendar scheduling as complete unless `add_event.js` returns `OK: <calendar_link>`.
- Never mark auto-posting as complete unless `post_from_calendar.js` returns `POSTED_EVENT:` and `DONE` (or `NO_DUE_EVENTS` for no pending items).
- Do not write assumed-success summaries.
