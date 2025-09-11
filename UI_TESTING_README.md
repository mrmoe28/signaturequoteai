# 🧪 UI Testing Agent

A comprehensive automated UI testing system for the Signature QuoteCrawler application that crawls and analyzes all pages to identify broken interactive elements, console errors, and missing functionality.

## 🎯 Features

### Core Testing Capabilities
- **Interactive Element Detection**: Finds buttons, tabs, forms, and navigation elements
- **Broken Button Detection**: Identifies buttons without proper click handlers
- **Tab Functionality Testing**: Verifies tab switching and ARIA compliance
- **Form Validation Testing**: Checks form submission and validation feedback
- **Console Error Monitoring**: Captures JavaScript errors and warnings
- **Navigation Link Validation**: Ensures links have valid destinations

### Reporting System
- **Detailed HTML Reports**: Professional, interactive reports with issue breakdown
- **JSON Export**: Machine-readable reports for CI/CD integration  
- **Trend Analysis**: Historical tracking of issues over time
- **Severity Classification**: Critical, High, Medium, Low priority categorization
- **Fix Suggestions**: Actionable recommendations for each issue

### Automation Features
- **CI/CD Integration**: Fail builds when thresholds are exceeded
- **Watch Mode**: Continuous testing during development
- **Auto-Fix Capabilities**: Automated repairs where possible
- **Scheduled Monitoring**: Run tests on a cron schedule
- **Alerting**: Webhook/Slack notifications when issues are detected

## 📦 Installation

The system uses existing dependencies (Playwright is already installed). Add the missing cron and file watching dependencies:

```bash
npm install cron chokidar
```

## 🚀 Quick Start

### 1. Run Basic UI Tests

```bash
# Run complete UI test suite
npm run test:ui

# Run with auto-fix attempts
npm run test:ui:fix

# Run in watch mode (re-runs on file changes)
npm run test:ui:watch

# Run in CI mode (strict threshold checking)
npm run test:ui:ci
```

### 2. View Reports

After running tests, reports are generated in the `reports/` directory:

```bash
# Open the latest HTML report
open reports/ui-test-report-*.html
```

### 3. Start Continuous Monitoring

```bash
# Start background monitoring (runs every 6 hours)
npm run monitor:ui

# Run a single monitoring check
npm run monitor:check

# Generate trend analysis report
npm run monitor:trend
```

## ⚙️ Configuration

Create `ui-test-config.json` to customize the testing behavior:

```json
{
  "projectName": "Signature QuoteCrawler",
  "baseUrl": "http://localhost:3000",
  "routes": [
    "/",
    "/dashboard", 
    "/products",
    "/quotes/new",
    "/cart"
  ],
  "excludeRoutes": [
    "/auth/login",
    "/auth/register"
  ],
  "testSettings": {
    "timeout": 30000,
    "retries": 2,
    "headless": true,
    "viewport": {
      "width": 1280,
      "height": 720
    }
  },
  "thresholds": {
    "maxCriticalIssues": 0,
    "maxHighIssues": 3,
    "maxMediumIssues": 10,
    "maxLowIssues": 20
  },
  "autoFix": {
    "enabled": false,
    "backupOriginal": true,
    "dryRun": true
  }
}
```

## 📊 Understanding Reports

### Severity Levels

- **🚨 Critical**: Issues that prevent core functionality (page crashes, major errors)
- **⚠️ High**: Important features broken (forms don't submit, navigation broken)  
- **📝 Medium**: UI components not responding (tabs don't switch, dropdowns don't open)
- **ℹ️ Low**: Minor issues (placeholder links, missing hover states)

### Issue Types

1. **Non-functioning Tab**: Tabs that don't switch content or lack proper ARIA attributes
2. **Broken Button**: Buttons without click handlers or visible functionality  
3. **Console Error**: JavaScript errors appearing in browser console
4. **Missing Event Listener**: Interactive elements without proper event handling
5. **Unresponsive Component**: UI components that don't respond to interactions

### Report Sections

- **Summary Dashboard**: Overview of issues by severity and type
- **Recommendations**: Prioritized action items based on findings
- **Page-by-Page Analysis**: Detailed breakdown for each tested route
- **Fix Suggestions**: Specific code recommendations for each issue

## 🛠️ Advanced Usage

### Custom Test Scenarios

Add custom test scenarios in `ui-test-config.json`:

```json
{
  "customChecks": [
    {
      "name": "Wizard Navigation", 
      "selector": ".wizard button",
      "expectedBehavior": "Should navigate between steps",
      "testAction": "click"
    },
    {
      "name": "Product Add Buttons",
      "selector": "button:contains('Add')", 
      "expectedBehavior": "Should add product to cart/quote",
      "testAction": "click"
    }
  ]
}
```

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run UI Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:ui:ci
  env:
    NODE_ENV: test
```

### Webhook Alerts

Configure webhook notifications in monitoring:

```bash
# Set environment variables
export UI_MONITOR_WEBHOOK="https://hooks.slack.com/services/..."
export UI_MONITOR_INTERVAL="0 */6 * * *"  # Every 6 hours

# Start monitoring with alerts
npm run monitor:ui
```

## 📁 File Structure

```
scripts/
├── ui-test-agent.ts          # Main testing engine
├── ui-monitor.ts             # Continuous monitoring service  
├── run-ui-tests.ts           # CLI runner script
tests/
├── global-setup.ts           # Test environment setup
├── global-teardown.ts        # Test cleanup
reports/                      # Generated test reports
├── ui-test-report-*.html     # Interactive HTML reports
├── ui-test-report-*.json     # Machine-readable reports
├── ui-trend-report-*.html    # Historical trend analysis
ui-test-config.json           # Test configuration
playwright.config.ts          # Playwright settings
```

## 🔧 Troubleshooting

### Common Issues

**Tests fail to start:**
```bash
# Ensure development server is running
npm run dev

# Check if port 3000 is available
lsof -i :3000
```

**No issues detected but UI seems broken:**
- Check `excludeRoutes` in config - you might be skipping problematic pages
- Verify `testPatterns` selectors match your component structure
- Review browser console for errors not caught by the test

**Auto-fix not working:**
- Auto-fix is currently limited and mostly suggests fixes rather than implementing them
- Most fixes require manual code changes based on the suggestions
- Use `dryRun: true` to preview what would be fixed

### Getting Help

1. Check the generated HTML report for detailed issue descriptions
2. Review the `suggestedFix` field for each issue
3. Look at console errors in the report for JavaScript problems
4. Use `--watch` mode during development to catch issues early

## 🎯 Best Practices

### For Developers

1. **Run tests locally** before pushing code
2. **Use watch mode** during active UI development  
3. **Address critical issues** immediately
4. **Review suggestions** even for low-priority issues
5. **Add test IDs** (`data-testid`) to components for reliable selection

### For CI/CD

1. **Set appropriate thresholds** based on your quality standards
2. **Run tests on staging** environment before production
3. **Store historical reports** for trend analysis
4. **Configure alerts** for critical issues
5. **Fail builds** only on critical/high priority issues

### Component Development

1. **Always add proper event handlers** to interactive elements
2. **Use semantic HTML** and ARIA attributes for accessibility
3. **Test edge cases** like form validation and error states
4. **Provide user feedback** for all actions (loading states, success messages)
5. **Follow consistent patterns** across similar components

## 📈 Monitoring Dashboard

The trend analysis shows:

- **Issue count over time** - Track whether your UI quality is improving
- **Issue type breakdown** - Identify systematic problems (e.g., many broken buttons)
- **Page-specific trends** - See which pages consistently have issues
- **Severity trends** - Monitor if critical issues are being resolved

## 🤝 Contributing

To extend the UI testing system:

1. **Add new test patterns** in `ui-test-agent.ts`
2. **Implement custom checks** via configuration
3. **Enhance reporting** in the HTML generation functions
4. **Add integrations** for other alerting systems
5. **Improve auto-fix** capabilities for common issues

## 📋 Maintenance

### Regular Tasks

- **Review weekly reports** to identify trends
- **Update test thresholds** as quality improves  
- **Add new routes** when pages are created
- **Refine test patterns** based on your component library
- **Clean up old reports** to save disk space

### Updating

The system will evolve with your application. Update configurations when:

- New pages or routes are added
- Component selectors change  
- Quality standards change
- New types of UI issues emerge

---

**🎉 Happy Testing!** This system helps maintain UI quality and catch regressions early. Use it as part of your development workflow to build more reliable user interfaces.