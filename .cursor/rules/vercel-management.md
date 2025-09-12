# Vercel Project Management Rules

## CRITICAL RULE: Never Create New Vercel Projects

- **NEVER** create new projects in Vercel automatically
- **ONLY** the user creates Vercel projects
- **ALWAYS** ask the user which Vercel project/directory to work with
- **DO NOT** assume or create new projects without explicit permission

## When Working with Vercel:

1. If unsure about which project to use, ask the user
2. If deployment fails due to project name issues, ask the user for guidance
3. If you need to deploy, ask the user for the correct project name/configuration
4. Never run `vercel --prod` or similar commands that might create new projects

## Example Questions to Ask:

- "Which Vercel project should I use for this deployment?"
- "What is the correct project name for this application?"
- "Should I deploy to an existing project or do you want to create a new one?"
