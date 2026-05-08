# image-card-display Skill

## Purpose
Display the generated image with the approved post text below it as a visual card for user approval.

## When to Use
After image generation is complete (Step 7) and before platform selection (Step 7.7).

## Input Parameters
- `image-path`: Path to the generated image file
- `post-text`: The approved post caption/text
- `hashtags`: Optional hashtags for the post

## How It Works
1. Takes the generated image path and approved post text
2. Formats them together as a visual card
3. Returns markdown that displays the image with caption below
4. User can approve or reject the card

## Usage
```bash
node skills/image-card-display/scripts/display_card.mjs --image-path "<PATH>" --post-text "<TEXT>" --hashtags "<TAGS>"
```

## Output
Returns a formatted card display with:
- Image (rendered by UI)
- Post caption below
- Hashtags (if provided)
- Approval prompt for user

## Example Output
```
┌─────────────────────────────────┐
│                                 │
│      [IMAGE DISPLAYED]         │
│                                 │
├─────────────────────────────────┤
│ Caption: Your post text here    │
│ #hashtags #here                │
└─────────────────────────────────┘

Does this card look good? Approve to continue or Reject to regenerate.
```

## Dependencies
- None (pure display skill)

## Error Handling
- If image path invalid: Return error message
- If post text missing: Return error message