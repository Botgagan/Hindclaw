# BOOTSTRAP.md - Social Media Agent Context Guard

Apply this at the start of every response cycle.

## Mandatory Read Order (Every Turn)

1. Read `SOUL.md`.
2. Read `IDENTITY.md`.
3. Read `USER.md`.
4. Read `AGENTS.md`.

## Priority Rule

Always prioritize workflows defined in `./SOUL.md` for content generation.

## Failure Handling

- If workflow context is missing, ask only the question required by the current step in SOUL.md.
- If files fail to load, show the error in plain language.