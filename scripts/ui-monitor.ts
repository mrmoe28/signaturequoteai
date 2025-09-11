#!/usr/bin/env tsx
/**
 * UI Monitoring Service
 * 
 * Provides continuous monitoring capabilities for the UI Test Agent
 * Can run on a schedule and alert when new issues are detected
 */

import 'dotenv/config';
import { runUITests, UITestAgent } from './ui-test-agent';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../lib/logger';
import { CronJob } from 'cron';

const logger = createLogger('ui-monitor');

interface MonitorConfig {
  interval: string; // cron format
  baseUrl: string;
  webhook?: string;
  email?: string;
  slack?: string;
  thresholds: {
    maxCriticalIssues: number;
    maxHighIssues: number;
    maxMediumIssues: number;
    maxLowIssues: number;
  };
}

interface HistoricalReport {
  timestamp: string;
  testRunId: string;
  summary: any;
  reportPath: string;
}

class UIMonitor {
  private config: MonitorConfig;
  private historyFile: string;
  private job: CronJob | null = null;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.historyFile = join(process.cwd(), 'reports', 'ui-monitor-history.json');
  }

  start() {
    logger.info(`Starting UI Monitor with interval: ${this.config.interval}`);
    logger.info(`Monitoring URL: ${this.config.baseUrl}`);
    
    this.job = new CronJob(this.config.interval, async () => {
      try {
        await this.runMonitoringCheck();
      } catch (error) {
        logger.error(`Monitoring check failed: ${error}`);
        await this.sendAlert('error', `Monitoring check failed: ${error}`);
      }
    }, null, true, 'America/New_York');

    logger.info('UI Monitor started successfully');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('UI Monitor stopped');
    }
  }

  private async runMonitoringCheck() {
    logger.info('Running scheduled UI monitoring check...');
    
    const report = await runUITests(this.config.baseUrl, false);
    
    // Save to history
    await this.saveToHistory({
      timestamp: report.timestamp,
      testRunId: report.testRunId,
      summary: report.summary,
      reportPath: join('reports', `ui-test-report-${report.testRunId}.html`)
    });

    // Check thresholds and send alerts
    await this.checkThresholdsAndAlert(report);
    
    logger.info(`Monitoring check completed. Issues found: ${report.summary.totalIssues}`);
  }

  private async saveToHistory(report: HistoricalReport) {
    let history: HistoricalReport[] = [];
    
    if (existsSync(this.historyFile)) {
      try {
        const historyData = readFileSync(this.historyFile, 'utf-8');
        history = JSON.parse(historyData);
      } catch (error) {
        logger.warn(`Could not read history file: ${error}`);
      }
    }

    history.unshift(report);
    
    // Keep only last 50 reports
    history = history.slice(0, 50);
    
    writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  private async checkThresholdsAndAlert(report: any) {
    const { summary } = report;
    const { thresholds } = this.config;
    const alerts: string[] = [];

    if (summary.criticalIssues > thresholds.maxCriticalIssues) {
      alerts.push(`🚨 CRITICAL: ${summary.criticalIssues} critical issues detected (threshold: ${thresholds.maxCriticalIssues})`);
    }

    if (summary.highIssues > thresholds.maxHighIssues) {
      alerts.push(`⚠️ HIGH: ${summary.highIssues} high priority issues detected (threshold: ${thresholds.maxHighIssues})`);
    }

    if (summary.mediumIssues > thresholds.maxMediumIssues) {
      alerts.push(`📝 MEDIUM: ${summary.mediumIssues} medium priority issues detected (threshold: ${thresholds.maxMediumIssues})`);
    }

    if (summary.lowIssues > thresholds.maxLowIssues) {
      alerts.push(`ℹ️ LOW: ${summary.lowIssues} low priority issues detected (threshold: ${thresholds.maxLowIssues})`);
    }

    if (alerts.length > 0) {
      const message = `UI Issues Detected in ${report.projectName}:\n\n${alerts.join('\n')}\n\nView full report: ${join(process.cwd(), 'reports', `ui-test-report-${report.testRunId}.html`)}`;
      
      await this.sendAlert('warning', message);
    }
  }

  private async sendAlert(level: 'error' | 'warning' | 'info', message: string) {
    logger.info(`Sending ${level} alert: ${message}`);

    // Send to webhook if configured
    if (this.config.webhook) {
      try {
        const response = await fetch(this.config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            timestamp: new Date().toISOString(),
            service: 'UI Monitor'
          })
        });
        
        if (response.ok) {
          logger.info('Webhook alert sent successfully');
        } else {
          logger.error(`Webhook alert failed: ${response.status}`);
        }
      } catch (error) {
        logger.error(`Webhook alert error: ${error}`);
      }
    }

    // Send to Slack if configured
    if (this.config.slack) {
      try {
        const slackMessage = {
          text: `UI Monitor Alert`,
          attachments: [{
            color: level === 'error' ? 'danger' : level === 'warning' ? 'warning' : 'good',
            title: `UI Issues Detected`,
            text: message,
            footer: 'UI Monitor',
            ts: Math.floor(Date.now() / 1000)
          }]
        };

        const response = await fetch(this.config.slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });

        if (response.ok) {
          logger.info('Slack alert sent successfully');
        } else {
          logger.error(`Slack alert failed: ${response.status}`);
        }
      } catch (error) {
        logger.error(`Slack alert error: ${error}`);
      }
    }

    // TODO: Implement email alerts if configured
    if (this.config.email) {
      logger.info('Email alerts not yet implemented');
    }
  }

  async generateTrendReport(): Promise<string> {
    if (!existsSync(this.historyFile)) {
      throw new Error('No historical data available');
    }

    const history: HistoricalReport[] = JSON.parse(readFileSync(this.historyFile, 'utf-8'));
    
    const trendReportPath = join(process.cwd(), 'reports', `ui-trend-report-${Date.now()}.html`);
    
    const html = this.generateTrendHTML(history);
    writeFileSync(trendReportPath, html);
    
    logger.info(`Trend report generated: ${trendReportPath}`);
    return trendReportPath;
  }

  private generateTrendHTML(history: HistoricalReport[]): string {
    const chartData = history.reverse().map(h => ({
      date: new Date(h.timestamp).toLocaleDateString(),
      total: h.summary.totalIssues,
      critical: h.summary.criticalIssues,
      high: h.summary.highIssues,
      medium: h.summary.mediumIssues,
      low: h.summary.lowIssues
    }));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Test Trend Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 2.5rem; font-weight: bold; color: #1a202c; margin: 0 0 10px 0; }
        .chart-container { position: relative; height: 400px; margin: 30px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat { background: #f7fafc; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #2d3748; }
        .stat-label { color: #4a5568; font-size: 0.9rem; margin-top: 5px; }
        .history-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .history-table th, .history-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .history-table th { background: #f7fafc; font-weight: bold; }
        .severity-badge { padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; font-weight: bold; }
        .critical { background: #fed7d7; color: #c53030; }
        .high { background: #feebc8; color: #dd6b20; }
        .medium { background: #faf089; color: #d69e2e; }
        .low { background: #c6f6d5; color: #38a169; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">UI Test Trend Report</h1>
            <p>Historical analysis of UI issues over time</p>
        </div>

        <div class="stats-grid">
            <div class="stat">
                <div class="stat-value">${history.length}</div>
                <div class="stat-label">Total Test Runs</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.round(history.reduce((acc, h) => acc + h.summary.totalIssues, 0) / history.length)}</div>
                <div class="stat-label">Avg Issues per Run</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.max(...history.map(h => h.summary.totalIssues))}</div>
                <div class="stat-label">Peak Issues</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.min(...history.map(h => h.summary.totalIssues))}</div>
                <div class="stat-label">Lowest Issues</div>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="trendChart"></canvas>
        </div>

        <table class="history-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Test Run ID</th>
                    <th>Total Issues</th>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Medium</th>
                    <th>Low</th>
                    <th>Report</th>
                </tr>
            </thead>
            <tbody>
                ${history.map(h => `
                    <tr>
                        <td>${new Date(h.timestamp).toLocaleDateString()}</td>
                        <td>${h.testRunId}</td>
                        <td><strong>${h.summary.totalIssues}</strong></td>
                        <td><span class="severity-badge critical">${h.summary.criticalIssues}</span></td>
                        <td><span class="severity-badge high">${h.summary.highIssues}</span></td>
                        <td><span class="severity-badge medium">${h.summary.mediumIssues}</span></td>
                        <td><span class="severity-badge low">${h.summary.lowIssues}</span></td>
                        <td><a href="${h.reportPath}" target="_blank">View Report</a></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <script>
        const ctx = document.getElementById('trendChart').getContext('2d');
        const chartData = ${JSON.stringify(chartData)};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [
                    {
                        label: 'Critical',
                        data: chartData.map(d => d.critical),
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'High',
                        data: chartData.map(d => d.high),
                        borderColor: '#dd6b20',
                        backgroundColor: 'rgba(221, 107, 32, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Medium',
                        data: chartData.map(d => d.medium),
                        borderColor: '#d69e2e',
                        backgroundColor: 'rgba(214, 158, 46, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Low',
                        data: chartData.map(d => d.low),
                        borderColor: '#38a169',
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'UI Issues Trend Over Time'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Issues'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
    `;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const defaultConfig: MonitorConfig = {
    interval: '0 */6 * * *', // Every 6 hours
    baseUrl: 'http://localhost:3000',
    thresholds: {
      maxCriticalIssues: 0,
      maxHighIssues: 3,
      maxMediumIssues: 10,
      maxLowIssues: 20
    }
  };

  switch (command) {
    case 'start':
      const monitor = new UIMonitor(defaultConfig);
      monitor.start();
      
      // Keep the process running
      process.on('SIGINT', () => {
        logger.info('Received SIGINT, stopping monitor...');
        monitor.stop();
        process.exit(0);
      });
      
      // Prevent the process from exiting
      setInterval(() => {}, 1000);
      break;

    case 'trend-report':
      const trendMonitor = new UIMonitor(defaultConfig);
      try {
        const reportPath = await trendMonitor.generateTrendReport();
        logger.info(`Trend report generated: ${reportPath}`);
      } catch (error) {
        logger.error(`Failed to generate trend report: ${error}`);
        process.exit(1);
      }
      break;

    case 'single-check':
      logger.info('Running single UI check...');
      try {
        const report = await runUITests(defaultConfig.baseUrl, false);
        logger.info(`Single check completed. Issues: ${report.summary.totalIssues}`);
      } catch (error) {
        logger.error(`Single check failed: ${error}`);
        process.exit(1);
      }
      break;

    default:
      console.log(`
UI Monitor Commands:

  start           Start continuous monitoring
  trend-report    Generate trend analysis report
  single-check    Run a single UI test check

Examples:
  tsx scripts/ui-monitor.ts start
  tsx scripts/ui-monitor.ts trend-report
  tsx scripts/ui-monitor.ts single-check
      `);
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    logger.error(`Monitor failed: ${error}`);
    process.exit(1);
  });
}

export { UIMonitor };