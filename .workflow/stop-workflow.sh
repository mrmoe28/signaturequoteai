#!/bin/bash

# Workflow Stopper Script
# This script stops the workflow bridge between Claude Code and Cursor

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW_DIR="$PROJECT_ROOT/.workflow"
PID_FILE="$WORKFLOW_DIR/bridge.pid"

echo "🛑 Stopping Claude Code <-> Cursor Workflow Bridge"

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    BRIDGE_PID=$(cat "$PID_FILE")
    
    # Check if process is still running
    if kill -0 "$BRIDGE_PID" 2>/dev/null; then
        echo "🔄 Stopping workflow bridge (PID: $BRIDGE_PID)..."
        kill "$BRIDGE_PID"
        
        # Wait for process to stop
        for i in {1..10}; do
            if ! kill -0 "$BRIDGE_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 "$BRIDGE_PID" 2>/dev/null; then
            echo "⚠️  Force killing workflow bridge..."
            kill -9 "$BRIDGE_PID" 2>/dev/null || true
        fi
        
        echo "✅ Workflow bridge stopped"
    else
        echo "⚠️  Workflow bridge was not running"
    fi
    
    # Remove PID file
    rm -f "$PID_FILE"
else
    echo "⚠️  No PID file found. Bridge may not be running."
fi

# Update status file
if [ -f "$PROJECT_ROOT/.workflow-status.json" ]; then
    # Use node to update the status
    node -e "
        const fs = require('fs');
        const statusFile = '$PROJECT_ROOT/.workflow-status.json';
        try {
            const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
            status.bridge = { active: false, lastUpdate: new Date().toISOString() };
            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
            console.log('📊 Status updated');
        } catch (error) {
            console.log('⚠️  Could not update status file');
        }
    "
fi

echo "🏁 Workflow bridge shutdown complete"