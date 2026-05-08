# instagram-post Skill

## Purpose
Automatically post images with captions to Instagram.

## When to Use
Step 11 of the Standard Workflow - after scheduling is confirmed.

## Input Parameters
- `CAPTION`: Post caption/text
- `IMAGE_URL`: URL of the image to post

## Setup Required
1. Meta Developer Account
2. Instagram App with permissions
3. Long-lived Access Token

## Usage
```bash
# Set environment variable
export IG_ACCESS_TOKEN="your_instagram_access_token"

# Run script
node skills/instagram-post/scripts/post_instagram.js "Your caption" "https://image-url.com/image.jpg"
```

## Output
- Success: Post ID
- Error: Error message

## Configuration
Create `instagram_config.env`:
```
IG_ACCESS_TOKEN=your_token_here
```

## Note
Requires Instagram Basic Display API permissions. Get token from Meta Developer Portal.
