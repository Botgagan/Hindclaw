# telegram-send-options Skill

Send a Telegram message with clickable inline keyboard options.

## Use this workflow

1. Prepare the question text and 2-8 options.
2. Run:

```bash
node skills/telegram-send-photo/scripts/send_buttons.js --text "Choose platform for this post:" --options "Facebook:facebook|Instagram:instagram|Both:both"
```

3. Wait for the user to click one option.
4. Continue workflow using the returned option value.

## Parameters

- `--text` (required): Message text shown to user
- `--options` (required): `Label:value|Label:value` list for buttons
- `--columns` (optional): Number of buttons per row (default `2`)
- `--chat-id` (optional): Telegram chat id
- `--token` (optional): Telegram bot token

## Notes

- Use concise labels (1-2 words).
- Do not include internal paths, commands, or debug data in `--text`.
- Credentials can be read from `openclaw.json` (`channels.telegram`).


