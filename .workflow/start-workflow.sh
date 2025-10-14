#!/bin/bash

# Workflow Starter Script
# This script initializes and starts the workflow bridge between Claude Code and Cursor

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW_DIR="$PROJECT_ROOT/.workflow"

echo "🚀 Starting Claude Code <-> Cursor Workflow Bridge"
echo "Project: $PROJECT_ROOT"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if Cursor is available
if ! command -v cursor &> /dev/null; then
    echo "⚠️  Warning: Cursor CLI is not in PATH. Some features may not work."
    echo "   Install Cursor CLI: https://cursor.sh/settings"
fi

# Create workflow directory if it doesn't exist
mkdir -p "$WORKFLOW_DIR"

# Initialize Cursor integration
echo "🔧 Initializing Cursor integration..."
node "$WORKFLOW_DIR/cursor-integration.js" init

# Start the workflow bridge in the background
echo "🌉 Starting workflow bridge..."
node "$WORKFLOW_DIR/workflow-bridge.js" &
BRIDGE_PID=$!

# Save PID for later cleanup
echo "$BRIDGE_PID" > "$WORKFLOW_DIR/bridge.pid"

echo "✅ Workflow bridge started (PID: $BRIDGE_PID)"
echo "📝 Logs: $WORKFLOW_DIR/workflow.log"
echo "📊 Status: .workflow-status.json"

# Wait a moment for initialization
sleep 2

# Show initial status
echo ""
echo "📋 Initial Status:"
node "$WORKFLOW_DIR/cursor-integration.js" status

echo ""
echo "🎯 Workflow bridge is running!"
echo "   - Files will be synchronized between Claude Code and Cursor"
echo "   - Use Ctrl+C to stop the bridge"
echo "   - Or run: kill $BRIDGE_PID"

# Keep script running to show logs
echo ""
echo "📝 Workflow logs (Ctrl+C to exit):"
tail -f "$WORKFLOW_DIR/workflow.log" &
TAIL_PID=$!

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping workflow bridge..."
    
    # Kill tail process
    if [ ! -z "$TAIL_PID" ]; then
        kill "$TAIL_PID" 2>/dev/null || true
    fi
    
    # Kill bridge process
    if [ ! -z "$BRIDGE_PID" ]; then
        kill "$BRIDGE_PID" 2>/dev/null || true
    fi
    
    # Remove PID file
    rm -f "$WORKFLOW_DIR/bridge.pid"
    
    echo "✅ Workflow bridge stopped"
    exit 0
}

# Trap cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait