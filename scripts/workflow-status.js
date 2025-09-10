#!/usr/bin/env node

/**
 * Integrated Workflow Status Monitor
 * Communicates between Claude Code, Cursor, and Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class WorkflowMonitor {
  constructor() {
    this.statusFile = path.join(__dirname, '../.workflow-status.json');
    this.initializeStatus();
  }

  initializeStatus() {
    const initialStatus = {
      claude: { active: true, lastUpdate: new Date().toISOString() },
      cursor: { active: false, lastUpdate: null },
      vercel: { active: false, deploymentStatus: 'idle' },
      git: { branch: this.getCurrentBranch(), clean: true },
      development: { devServer: false, port: 3000 }
    };
    
    this.writeStatus(initialStatus);
  }

  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'main';
    }
  }

  updateStatus(component, updates) {
    const status = this.readStatus();
    status[component] = { ...status[component], ...updates, lastUpdate: new Date().toISOString() };
    this.writeStatus(status);
    console.log(`✅ Updated ${component} status:`, updates);
  }

  readStatus() {
    try {
      return JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
    } catch (error) {
      return {};
    }
  }

  writeStatus(status) {
    fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
  }

  getFullStatus() {
    return this.readStatus();
  }

  startMonitoring() {
    console.log('🚀 Starting Integrated Workflow Monitor...');
    console.log('📊 Status file:', this.statusFile);
    
    // Monitor development server
    this.checkDevServer();
    
    // Monitor git status
    this.checkGitStatus();
    
    // Setup periodic checks
    setInterval(() => {
      this.checkDevServer();
      this.checkGitStatus();
    }, 5000);
  }

  checkDevServer() {
    try {
      execSync('curl -s http://localhost:3000 > /dev/null');
      this.updateStatus('development', { devServer: true, port: 3000 });
    } catch (error) {
      this.updateStatus('development', { devServer: false, port: null });
    }
  }

  checkGitStatus() {
    try {
      const branch = this.getCurrentBranch();
      const isClean = execSync('git status --porcelain', { encoding: 'utf8' }).trim() === '';
      this.updateStatus('git', { branch, clean: isClean });
    } catch (error) {
      // Git operations failed
    }
  }
}

// CLI Interface
const monitor = new WorkflowMonitor();

const command = process.argv[2];
switch (command) {
  case 'start':
    monitor.startMonitoring();
    break;
  case 'status':
    console.log('📊 Current Workflow Status:');
    console.log(JSON.stringify(monitor.getFullStatus(), null, 2));
    break;
  case 'update':
    const component = process.argv[3];
    const key = process.argv[4];
    const value = process.argv[5];
    monitor.updateStatus(component, { [key]: value });
    break;
  default:
    console.log('Usage: node workflow-status.js [start|status|update]');
}

module.exports = WorkflowMonitor;