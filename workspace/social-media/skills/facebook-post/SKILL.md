# facebook-post Skill

## Purpose
Automatically post images with captions to Facebook Page.

## When to Use
Step 11 of the Standard Workflow - after scheduling is confirmed.

## Input Parameters
- `CAPTION`: Post caption/text
- `IMAGE_URL`: URL of the image to post

## Setup Required
1. Meta Developer Account
2. Facebook Page (admin required)
3. Page Access Token with permissions:
   - pages_show_list
   - pages_manage_posts
   - instagram_basic
   - instagram_manage_messages

## Usage
```bash
# Set environment variables
export FB_PAGE_ACCESS_TOKEN="your_page_token"
export FB_PAGE_ID="your_page_id"

# Run script
node skills/facebook-post/scripts/post_facebook.js "Your caption" "https://image-url.com/image.jpg"
```

## Output
- Success: Photo ID and post URL
- Error: Error message

## Configuration
Create `facebook_config.env`:
```
FB_PAGE_ACCESS_TOKEN=your_token_here
FB_PAGE_ID=your_page_id
```

## Note
Requires Facebook Graph API. Get token from Meta Developer Portal with page permissions.
