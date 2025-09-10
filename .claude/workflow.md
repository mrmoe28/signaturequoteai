# Integrated Development Workflow

## Tools Integration
- **Claude Code**: Task orchestration, Git operations, deployment commands
- **Cursor**: Code editing, local development, debugging  
- **Vercel**: Production deployment, build monitoring, branch previews

## Workflow Commands

### Development Phase
```bash
# In Claude Code - Start development session
npm run dev:integrated

# In Cursor - Enable live reload with Claude sync
npm run cursor:sync

# Monitor in Vercel - Track deployment status
vercel dev --listen 3001
```

### Testing Phase  
```bash
# Claude Code orchestrates testing
npm run test:full

# Cursor provides debugging interface
npm run test:debug

# Vercel provides staging environment
vercel --target staging
```

### Deployment Phase
```bash
# Claude Code manages git and deployment
npm run deploy:preview  # Creates preview deployment
npm run deploy:production  # Deploys to main

# Cursor tracks build progress
npm run build:watch

# Vercel handles automatic deployment
# (Triggered by git push)
```

## Communication Channels

1. **File System Sync**: All tools watch same directory
2. **Git Integration**: Shared repository state  
3. **Environment Variables**: Shared .env configuration
4. **Process Communication**: Shared ports and sockets
5. **Webhook Integration**: Deployment status updates