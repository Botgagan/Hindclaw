#!/bin/bash
# Google OAuth Token Generator
# Run this once to get refresh token, then tokens.env will be created

CLIENT_ID="${GOOGLE_CLIENT_ID:-YOUR_CLIENT_ID}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-YOUR_CLIENT_SECRET}"

echo "Opening Google OAuth URL..."
echo "1. Go to: https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/calendar.events"
echo "2. Copy the authorization code"
echo "3. Paste it below when asked"

read -p "Enter authorization code: " AUTH_CODE

echo "Exchanging for tokens..."

RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "code=$AUTH_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob")

REFRESH_TOKEN=$(echo $RESPONSE | grep -o '"refresh_token"[^,]*' | cut -d'"' -f4)

if [ -n "$REFRESH_TOKEN" ]; then
  echo "REFRESH_TOKEN=\"$REFRESH_TOKEN\"" > tokens.env
  echo "CLIENT_ID=\"$CLIENT_ID\"" >> tokens.env
  echo "CLIENT_SECRET=\"$CLIENT_SECRET\"" >> tokens.env
  echo "SUCCESS! tokens.env created."
else
  echo "Error getting refresh token. Check response:"
  echo $RESPONSE
fi