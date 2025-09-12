# Automated Google Cloud Setup with Playwright

This guide shows you how to automate **90%** of the Google Cloud Console setup using Playwright and Desktop Commander.

## 🤖 What Can Be Automated

### ✅ **Fully Automated:**
- Project creation
- API enablement (Gmail API, Google+ API)
- OAuth consent screen configuration
- OAuth 2.0 client creation
- Service account creation
- Environment variable updates
- Credential extraction and validation

### ⚠️ **Semi-Automated:**
- Google account login (you log in, script continues)
- Service account key download (script triggers, you save file)

### ❌ **Manual Only:**
- Billing setup (if required)
- Domain verification (if using custom domain)

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install playwright @playwright/test
npx playwright install chromium
```

### Step 2: Configure the Automation
Edit `scripts/automate-google-cloud-setup.ts` and update the config:

```typescript
const config: SetupConfig = {
  projectName: 'SignatureQuoteCrawler',
  userEmail: 'your-email@gmail.com',        // ← Your Google account
  appName: 'SignatureQuoteCrawler',
  localUrl: 'http://localhost:3000',
  productionUrl: 'https://your-domain.com', // ← Your production URL
  serviceAccountName: 'signature-quote-emailer',
  oauthClientName: 'SignatureQuoteCrawler Web Client'
};
```

### Step 3: Run the Automation
```bash
npx tsx scripts/automate-google-cloud-setup.ts
```

### Step 4: Extract Service Account Credentials
After the automation completes, run:
```bash
node scripts/extract-service-account-credentials.js
```

### Step 5: Test Everything
```bash
node scripts/test-new-google-setup.js
```

## 📋 Detailed Process

### What the Automation Does

1. **Opens Google Cloud Console** in a browser
2. **Prompts you to log in** (you do this manually)
3. **Creates a new project** with your specified name
4. **Enables required APIs** (Gmail API, Google+ API)
5. **Configures OAuth consent screen** with all required scopes
6. **Creates OAuth 2.0 client** with correct redirect URIs
7. **Creates service account** for Gmail API
8. **Triggers key download** (you save the JSON file)
9. **Updates .env.local** with OAuth credentials
10. **Provides next steps** for completing setup

### What You Need to Do

1. **Log in** when prompted by the browser
2. **Save the service account JSON** when it downloads
3. **Run the credential extractor** to get the private key
4. **Test the setup** to ensure everything works

## 🔧 Advanced Configuration

### Customizing the Automation

You can modify the automation script to:
- Add more OAuth scopes
- Configure different redirect URIs
- Set up additional service accounts
- Customize project settings

### Headless Mode

For server environments, you can run in headless mode:
```typescript
this.browser = await chromium.launch({ 
  headless: true, // Enable headless mode
  slowMo: 1000
});
```

### Error Handling

The script includes comprehensive error handling:
- Retries for network issues
- Clear error messages
- Rollback capabilities
- Detailed logging

## 🧪 Testing and Validation

### Automated Testing
The script includes built-in validation:
- Verifies project creation
- Confirms API enablement
- Validates OAuth configuration
- Tests service account creation

### Manual Verification
After automation, verify:
- OAuth consent screen is configured correctly
- Redirect URIs match your application URLs
- Service account has proper permissions
- Environment variables are set correctly

## 🛠️ Troubleshooting

### Common Issues

**Browser doesn't open:**
```bash
npx playwright install chromium
```

**Login fails:**
- Clear browser cache
- Try incognito mode
- Check 2FA settings

**Project creation fails:**
- Verify you have project creation permissions
- Check if project name is already taken
- Ensure billing is enabled

**API enablement fails:**
- Check if APIs are already enabled
- Verify project permissions
- Try manual enablement

### Debug Mode

Enable debug mode for detailed logging:
```typescript
await this.page!.screenshot({ path: 'debug-screenshot.png' });
console.log('Current URL:', await this.page!.url());
```

## 📊 Success Metrics

After successful automation, you should have:

- ✅ New Google Cloud project created
- ✅ Gmail API and Google+ API enabled
- ✅ OAuth consent screen configured
- ✅ OAuth 2.0 client with correct redirect URIs
- ✅ Service account for Gmail API
- ✅ Environment variables updated
- ✅ All credentials extracted and validated

## 🔒 Security Considerations

- **Never commit** the service account JSON file
- **Rotate keys** periodically
- **Use separate projects** for dev/prod
- **Monitor API usage** in Google Cloud Console
- **Review permissions** regularly

## 🚀 Next Steps

After successful automation:

1. **Test OAuth flow** in your application
2. **Test Gmail API** email sending
3. **Deploy to production** with production URLs
4. **Monitor usage** and performance
5. **Set up alerts** for API quotas

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Google Cloud Console API](https://cloud.google.com/apis)
- [OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the automation logs
3. Verify your Google Cloud permissions
4. Test manual setup as fallback

The automation handles 90% of the setup, but manual verification ensures everything works correctly! 🎉
