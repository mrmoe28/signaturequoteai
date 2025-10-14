# Claude Code ↔ Cursor Workflow Integration

This workflow system enables seamless communication between Claude Code and Cursor IDE for collaborative development.

## 🚀 Quick Start

### Starting the Workflow

```bash
# Start the workflow bridge
./.workflow/start-workflow.sh

# Or start in background
node .workflow/workflow-bridge.js &
```

### Stopping the Workflow

```bash
# Stop the workflow bridge
./.workflow/stop-workflow.sh
```

## 📁 System Architecture

```
.workflow/
├── workflow-bridge.js      # Main communication bridge
├── cursor-integration.js   # Cursor IDE integration utilities
├── start-workflow.sh       # Startup script
├── stop-workflow.sh        # Shutdown script
├── commands.json          # Command queue (auto-generated)
├── events.json           # Event log (auto-generated)
├── cursor-config.json    # Cursor configuration (auto-generated)
└── workflow.log          # System logs (auto-generated)
```

## 🔧 Features

### File Synchronization
- Real-time file sync between Claude Code and Cursor
- Automatic file watching and updates
- Conflict resolution

### Command Bridge
- Execute commands across both applications
- Queue-based command processing
- Status tracking and logging

### IDE Integration
- Open files in Cursor from Claude Code
- Jump to specific lines
- Create new files and open them

### Git Integration
- Synchronized commit operations
- Branch status tracking
- Merge conflict detection

## 🔌 API Usage

### From Claude Code

```javascript
const CursorIntegration = require('./.workflow/cursor-integration');
const cursor = new CursorIntegration();

// Open file in Cursor
cursor.openFile('src/components/MyComponent.tsx', 42);

// Sync file content
cursor.syncFile('package.json', updatedContent);

// Create and open new file
cursor.createAndOpen('src/utils/newUtil.ts', templateContent);
```

### Command Queue

```javascript
const WorkflowBridge = require('./.workflow/workflow-bridge');

// Send command to queue
WorkflowBridge.sendCommand('file_sync', 'Update component', {
  filePath: 'src/App.tsx',
  content: newContent
});
```

## 📊 Status Monitoring

The workflow status is tracked in `.workflow-status.json`:

```json
{
  "claude": { "active": true },
  "cursor": { "active": false, "ready": true },
  "bridge": { "active": false, "ready": true },
  "workflow": { "established": true, "communicationReady": true }
}
```

## 🎯 Supported Commands

| Command Type | Description | Data Fields |
|-------------|-------------|-------------|
| `file_sync` | Synchronize file content | `filePath`, `content` |
| `cursor_open` | Open file in Cursor | `filePath`, `line?` |
| `git_sync` | Git operations | `action`, `message` |

## 📋 Prerequisites

- **Node.js** (v14+)
- **Cursor CLI** installed and in PATH
  - Install: [Cursor Settings → Install CLI](https://cursor.sh/settings)
- **Git** for version control operations

## 🔍 Troubleshooting

### Cursor CLI Not Found
```bash
# Install Cursor CLI
# Go to Cursor → Settings → Install CLI
# Or add Cursor to your PATH manually
```

### Permission Denied
```bash
# Make scripts executable
chmod +x .workflow/*.sh
```

### Bridge Won't Start
```bash
# Check logs
tail -f .workflow/workflow.log

# Check status
node .workflow/cursor-integration.js status
```

### File Sync Issues
```bash
# Restart the bridge
./.workflow/stop-workflow.sh
./.workflow/start-workflow.sh
```

## 🛠 Development

### Adding New Command Types

1. Edit `workflow-bridge.js` → `executeCommand()` method
2. Add command handler
3. Update documentation

### Custom Event Handlers

1. Edit `workflow-bridge.js` → `emitEvent()` method
2. Add event processing logic
3. Test with event queue

## 📝 Logs and Debugging

- **System logs**: `.workflow/workflow.log`
- **Commands queue**: `.workflow/commands.json`
- **Events log**: `.workflow/events.json`
- **Status tracking**: `.workflow-status.json`

## 🚀 Next Steps

The workflow system is ready! To activate:

1. **Start the bridge**: `./workflow/start-workflow.sh`
2. **Open Cursor**: The system will attempt to integrate automatically
3. **Begin development**: Files and commands will sync between applications

The workflow will remain active until stopped manually or the bridge process is terminated.