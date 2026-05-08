# REFERENCE.md - Social Media Agent Supporting Details

Use this file for detailed examples and supporting patterns. `SOUL.md` remains the primary source of workflow behavior.

## Platform Style Notes

- Instagram: short, visual-first, hashtag-friendly.
- LinkedIn: professional, longer, insight-led.
- Twitter/X: concise and sharp.

## Theme and Post Output Shape

Themes:
1. Title:
   Description:

Posts:
1. Caption:
   Hashtags:

## Image Prompt Template

Include:
- scene description
- mood
- colors
- style

Example:
"A calm sunrise over mountains with soft golden light, a person meditating in peaceful posture, warm tones, minimal aesthetic, serene and spiritual mood."

## Video Script Template

1. Hook (2-3 seconds)
2. Main content
3. Closing CTA

## Scheduling Checklist

Collect and confirm:
- day/date
- time
- platform

## Engagement Reply Guidance

- Keep replies short, positive, and brand-aligned.
- For negative comments, acknowledge feedback calmly and avoid argument.

## Logging References

Suggested triggers:
- `themes_generated`
- `themes_approved`
- `themes_rejected`
- `posts_generated`
- `posts_approved`
- `posts_rejected`
- `asset_choice_selected`
- `image_prompt_created`
- `image_generated`
- `video_script_created`
- `video_generated`
- `post_scheduled`
- `schedule_updated`

Suggested internal log format:

```json
{
  "timestamp": "ISO-8601",
  "agent": "social-media",
  "action": "string",
  "status": "success|error|pending",
  "details": {}
}
```

Do not print raw logs in user-facing replies unless explicitly requested.

## Telegram Option Map

Use `node skills/telegram-send-photo/scripts/send_buttons.js` for all predefined choices.

Theme approval:
- Text: `Please choose one theme to continue:`
- Options: `Theme 1:theme_1|Theme 2:theme_2|Theme 3:theme_3|Theme 4:theme_4|Theme 5:theme_5|Refine Themes:refine_themes`

Post approval:
- Text: `Please choose one post to continue:`
- Options: `Post 1:post_1|Post 2:post_2|Post 3:post_3|Post 4:post_4|Post 5:post_5|Refine Posts:refine_posts`

Asset choice:
- Text: `Choose asset type for this post:`
- Options: `Image:image|Video:video|Both:both|Skip:skip`

Image prompt approval:
- Text: `Approve this image prompt?`
- Options: `Approve Prompt:approve_prompt|Refine Prompt:refine_prompt|Regenerate Prompt:regenerate_prompt`

Platform choice:
- Text: `Choose platform for this post:`
- Options: `Facebook:facebook|Instagram:instagram|Both:both`

Schedule confirmation:
- Text: `Please confirm the schedule:`
- Options: `Confirm Schedule:confirm_schedule|Change Time:change_time`

Final action:
- Text: `What would you like to do next?`
- Options: `Create Another Post:create_another_post|Finish:finish`


