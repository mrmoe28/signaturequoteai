#!/usr/bin/env node

/**
 * Cursor Integration - Helper functions for Cursor IDE integration
 * This module provides utilities to interact with Cursor from Claude Code
 */

const fs = require('fs');
const path = require('path');
const WorkflowBridge = require('./workflow-bridge');

class CursorIntegration {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.workflowDir = path.join(this.projectRoot, '.workflow');
  }

  /**
   * Open a file in Cursor at a specific line
   */
  openFile(filePath, line = null) {
    return WorkflowBridge.sendCommand('cursor_open', `Open ${filePath} in Cursor`, {
      filePath,
      line
    });
  }

  /**
   * Sync a file between Claude Code and Cursor
   */
  syncFile(filePath, content) {
    return WorkflowBridge.sendCommand('file_sync', `Sync file ${filePath}`, {
      filePath,
      content
    });
  }

  /**
   * Create a new file and open it in Cursor
   */
  createAndOpen(filePath, content = '') {
    const fullPath = path.join(this.projectRoot, filePath);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create file
      fs.writeFileSync(fullPath, content);
      
      // Open in Cursor
      this.openFile(filePath);
      
      return true;
    } catch (error) {
      console.error('Error creating file:', error.message);
      return false;
    }
  }

  /**
   * Send a git commit command
   */
  gitCommit(message) {
    return WorkflowBridge.sendCommand('git_sync', `Git commit: ${message}`, {
      action: 'commit',
      message
    });
  }

  /**
   * Get workflow status
   */
  getStatus() {
    const statusFile = path.join(this.projectRoot, '.workflow-status.json');
    
    try {
      if (fs.existsSync(statusFile)) {
        return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading status:', error.message);
    }
    
    return null;
  }

  /**
   * Wait for Cursor to be active in the workflow
   */
  async waitForCursor(timeout = 30000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const status = this.getStatus();
        
        if (status && status.cursor && status.cursor.active) {
          clearInterval(checkInterval);
          resolve(true);
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for Cursor to connect'));
        }
      }, 1000);
    });
  }

  /**
   * Initialize Cursor integration
   */
  async initialize() {
    console.log('Initializing Cursor integration...');
    
    // Create workflow directory if it doesn't exist
    if (!fs.existsSync(this.workflowDir)) {
      fs.mkdirSync(this.workflowDir, { recursive: true });
    }

    // Create a simple cursor configuration file
    const cursorConfig = {
      name: "SignatureQuoteCrawler",
      type: "node",
      request: "launch",
      program: "${workspaceFolder}/app.js",
      console: "integratedTerminal",
      workflow: {
        bridge: true,
        autoSync: true,
        openOnEdit: true
      }
    };

    const cursorConfigPath = path.join(this.workflowDir, 'cursor-config.json');
    fs.writeFileSync(cursorConfigPath, JSON.stringify(cursorConfig, null, 2));

    console.log('Cursor integration initialized');
    return true;
  }
}

// Command line interface
if (require.main === module) {
  const cursor = new CursorIntegration();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'init':
      cursor.initialize();
      break;
    case 'open':
      const filePath = args[0];
      const line = args[1] ? parseInt(args[1]) : null;
      cursor.openFile(filePath, line);
      break;
    case 'create':
      cursor.createAndOpen(args[0], args[1] || '');
      break;
    case 'status':
      console.log(JSON.stringify(cursor.getStatus(), null, 2));
      break;
    default:
      console.log('Usage: cursor-integration.js [init|open|create|status]');
  }
}

module.exports = CursorIntegration;