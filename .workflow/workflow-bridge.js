#!/usr/bin/env node

/**
 * Workflow Bridge - Communication system between Claude Code and Cursor
 * This script establishes a bidirectional communication channel using file watchers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class WorkflowBridge {
  constructor() {
    this.projectRoot = process.cwd();
    this.workflowDir = path.join(this.projectRoot, '.workflow');
    this.statusFile = path.join(this.projectRoot, '.workflow-status.json');
    this.commandsFile = path.join(this.workflowDir, 'commands.json');
    this.eventsFile = path.join(this.workflowDir, 'events.json');
    this.logFile = path.join(this.workflowDir, 'workflow.log');
    
    this.init();
  }

  init() {
    // Ensure workflow directory exists
    if (!fs.existsSync(this.workflowDir)) {
      fs.mkdirSync(this.workflowDir, { recursive: true });
    }

    // Initialize files
    this.initializeFiles();
    
    // Start watchers
    this.startCommandWatcher();
    this.startStatusUpdater();
    
    this.log('Workflow Bridge initialized successfully');
    this.updateStatus('bridge', { active: true, lastUpdate: new Date().toISOString() });
  }

  initializeFiles() {
    const defaultCommands = {
      pending: [],
      completed: [],
      lastProcessed: new Date().toISOString()
    };

    const defaultEvents = {
      events: [],
      lastEvent: null
    };

    if (!fs.existsSync(this.commandsFile)) {
      fs.writeFileSync(this.commandsFile, JSON.stringify(defaultCommands, null, 2));
    }

    if (!fs.existsSync(this.eventsFile)) {
      fs.writeFileSync(this.eventsFile, JSON.stringify(defaultEvents, null, 2));
    }

    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }

  startCommandWatcher() {
    fs.watchFile(this.commandsFile, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        this.processCommands();
      }
    });
  }

  startStatusUpdater() {
    // Update status every 30 seconds
    setInterval(() => {
      this.updateStatus('bridge', { 
        active: true, 
        lastUpdate: new Date().toISOString(),
        pid: process.pid
      });
    }, 30000);
  }

  processCommands() {
    try {
      const commands = JSON.parse(fs.readFileSync(this.commandsFile, 'utf8'));
      
      if (commands.pending && commands.pending.length > 0) {
        commands.pending.forEach(command => {
          this.executeCommand(command);
          commands.completed.push({
            ...command,
            executedAt: new Date().toISOString()
          });
        });

        // Clear pending commands
        commands.pending = [];
        commands.lastProcessed = new Date().toISOString();
        
        fs.writeFileSync(this.commandsFile, JSON.stringify(commands, null, 2));
      }
    } catch (error) {
      this.log(`Error processing commands: ${error.message}`);
    }
  }

  executeCommand(command) {
    this.log(`Executing command: ${command.type} - ${command.description}`);
    
    switch (command.type) {
      case 'file_sync':
        this.syncFile(command.data);
        break;
      case 'cursor_open':
        this.openInCursor(command.data);
        break;
      case 'git_sync':
        this.syncGit(command.data);
        break;
      default:
        this.log(`Unknown command type: ${command.type}`);
    }
  }

  syncFile(data) {
    const { filePath, content } = data;
    try {
      if (content) {
        fs.writeFileSync(path.join(this.projectRoot, filePath), content);
        this.emitEvent('file_synced', { filePath, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      this.log(`Error syncing file ${filePath}: ${error.message}`);
    }
  }

  openInCursor(data) {
    const { filePath, line } = data;
    const fullPath = path.join(this.projectRoot, filePath);
    
    // Try to open in Cursor
    const cursorCmd = line ? `cursor -g ${fullPath}:${line}` : `cursor ${fullPath}`;
    
    spawn('cursor', line ? ['-g', `${fullPath}:${line}`] : [fullPath], {
      detached: true,
      stdio: 'ignore'
    }).unref();

    this.emitEvent('cursor_opened', { filePath, line, timestamp: new Date().toISOString() });
  }

  syncGit(data) {
    const { action, message } = data;
    
    if (action === 'commit') {
      const gitProcess = spawn('git', ['commit', '-m', message], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      gitProcess.on('close', (code) => {
        this.emitEvent('git_committed', { 
          success: code === 0, 
          message, 
          timestamp: new Date().toISOString() 
        });
      });
    }
  }

  emitEvent(type, data) {
    try {
      const events = JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
      const newEvent = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      events.events.push(newEvent);
      events.lastEvent = newEvent;
      
      // Keep only last 100 events
      if (events.events.length > 100) {
        events.events = events.events.slice(-100);
      }
      
      fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2));
      this.log(`Event emitted: ${type}`);
    } catch (error) {
      this.log(`Error emitting event: ${error.message}`);
    }
  }

  updateStatus(component, status) {
    try {
      let currentStatus = {};
      if (fs.existsSync(this.statusFile)) {
        currentStatus = JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
      }
      
      currentStatus[component] = { ...currentStatus[component], ...status };
      fs.writeFileSync(this.statusFile, JSON.stringify(currentStatus, null, 2));
    } catch (error) {
      this.log(`Error updating status: ${error.message}`);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(`[WorkflowBridge] ${message}`);
  }

  // Public API methods
  static sendCommand(type, description, data) {
    const workflowDir = path.join(process.cwd(), '.workflow');
    const commandsFile = path.join(workflowDir, 'commands.json');
    
    try {
      const commands = fs.existsSync(commandsFile) 
        ? JSON.parse(fs.readFileSync(commandsFile, 'utf8'))
        : { pending: [], completed: [] };
      
      commands.pending.push({
        id: Date.now().toString(),
        type,
        description,
        data,
        timestamp: new Date().toISOString()
      });
      
      fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));
      return true;
    } catch (error) {
      console.error('Error sending command:', error.message);
      return false;
    }
  }
}

// Start the bridge if run directly
if (require.main === module) {
  new WorkflowBridge();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down workflow bridge...');
    process.exit(0);
  });
}

module.exports = WorkflowBridge;