# Service Account JSON Extraction Fix

## Problem
The `extract-service-account-credentials.js` script was failing with "No service account JSON files found in download folder" even when the JSON file was present in Downloads.

## Root Cause
The script was filtering JSON files by looking for specific keywords in the filename:
- "service"
- "key" 
- "credentials"

However, the actual service account file was named `signatureqoute-e2bc41be61f3.json` which didn't contain any of these keywords.

## Solution
Updated the filtering logic in `extract-service-account-credentials.js` to be more inclusive:

1. **Added more keywords** to match common service account file patterns:
   - "signature" (for this specific project)
   - "gmail" (common in Gmail service accounts)
   - "email" (common in email service accounts)
   - "oauth" (common in OAuth credentials)
   - "google" (common in Google service accounts)

2. **Added fallback logic**: If no files match the keywords but JSON files exist, show all JSON files as candidates

3. **Added validation**: Check that the selected JSON file actually contains required service account fields (`client_email`, `private_key`, `project_id`)

4. **Added debugging**: Show all JSON files found in Downloads for easier troubleshooting

## Alternative Solution
Created `auto-extract-credentials.js` script that directly processes the known service account file without requiring user interaction.

## Files Modified
- `scripts/extract-service-account-credentials.js` - Updated filtering logic
- `scripts/auto-extract-credentials.js` - Created automated extraction script

## Usage
```bash
# Interactive version (shows all JSON files and lets you choose)
node scripts/extract-service-account-credentials.js

# Automated version (directly processes the known file)
node scripts/auto-extract-credentials.js
```

## Result
Successfully extracted service account credentials:
- Client Email: signature-quote-emailer@signatureqoute.iam.gserviceaccount.com
- Project ID: signatureqoute
- Private Key: 1704 characters

Credentials were automatically added to `.env.local` file.
