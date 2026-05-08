@echo off
REM Run the calendar auto-post script every 5 minutes
cd /d "C:\Users\Gagandeep Saini\.openclaw\workspace\social-media"
node skills\google-calendar-add\scripts\post_from_calendar.js >> logs\scheduler.log 2>&1