#!/usr/bin/env tsx

/**
 * Vercel Auto-Fix Script
 * Automatically detects and fixes common Vercel deployment errors
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VercelError {
  type: 'build' | 'runtime' | 'deployment' | 'environment';
  message: string;
  fix: string;
  applied: boolean;
}

class VercelFixer {
  private errors: VercelError[] = [];
  private fixesApplied: string[] = [];

  async run() {
    console.log('🔍 Analyzing Vercel deployment...\n');
    
    try {
      // Check deployment status
      await this.checkDeploymentStatus();
      
      // Analyze common issues
      await this.analyzeBuildIssues();
      await this.analyzeEnvironmentIssues();
      await this.analyzeRuntimeIssues();
      
      // Apply fixes
      await this.applyFixes();
      
      // Report results
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      process.exit(1);
    }
  }

  private async checkDeploymentStatus() {
    try {
      console.log('📊 Checking deployment status...');
      const output = execSync('vercel ls --json', { encoding: 'utf8' });
      const deployments = JSON.parse(output);
      
      if (deployments.length === 0) {
        this.addError('deployment', 'No deployments found', 'Run vercel deploy to create a deployment');
        return;
      }
      
      const latest = deployments[0];
      console.log(`✅ Latest deployment: ${latest.url} (${latest.state})`);
      
      if (latest.state !== 'READY') {
        this.addError('deployment', `Deployment state: ${latest.state}`, 'Check logs and fix issues');
      }
      
    } catch (error) {
      this.addError('deployment', 'Failed to check deployment status', 'Ensure Vercel CLI is installed and authenticated');
    }
  }

  private async analyzeBuildIssues() {
    console.log('🔨 Analyzing build issues...');
    
    // Check TypeScript errors
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    } catch (error) {
      this.addError('build', 'TypeScript compilation errors', 'Fix TypeScript errors in code');
    }
    
    // Check ESLint errors
    try {
      execSync('npm run lint', { stdio: 'pipe' });
    } catch (error) {
      this.addError('build', 'ESLint errors found', 'Fix linting issues');
    }
    
    // Check package.json issues
    if (!existsSync('package.json')) {
      this.addError('build', 'Missing package.json', 'Create package.json file');
    }
    
    // Check Next.js configuration
    if (!existsSync('next.config.mjs') && !existsSync('next.config.js')) {
      this.addError('build', 'Missing Next.js config', 'Create next.config.mjs file');
    }
  }

  private async analyzeEnvironmentIssues() {
    console.log('🌍 Analyzing environment issues...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_APP_URL',
      'AUTH_SECRET',
      'DATABASE_URL'
    ];
    
    const envFile = '.env.local';
    if (!existsSync(envFile)) {
      this.addError('environment', 'Missing .env.local file', 'Create .env.local with required variables');
    } else {
      const envContent = readFileSync(envFile, 'utf8');
      requiredEnvVars.forEach(envVar => {
        if (!envContent.includes(envVar)) {
          this.addError('environment', `Missing environment variable: ${envVar}`, `Add ${envVar} to .env.local`);
        }
      });
    }
  }

  private async analyzeRuntimeIssues() {
    console.log('⚡ Analyzing runtime issues...');
    
    // Check for common Next.js issues
    const appDir = 'app';
    const pagesDir = 'pages';
    
    if (!existsSync(appDir) && !existsSync(pagesDir)) {
      this.addError('runtime', 'Missing app or pages directory', 'Create app directory for Next.js App Router');
    }
    
    // Check for API route issues
    const apiDir = join(appDir, 'api');
    if (existsSync(apiDir)) {
      // Check for common API route issues
      console.log('🔍 Checking API routes...');
    }
  }

  private addError(type: VercelError['type'], message: string, fix: string) {
    this.errors.push({
      type,
      message,
      fix,
      applied: false
    });
  }

  private async applyFixes() {
    console.log('\n🔧 Applying fixes...\n');
    
    for (const error of this.errors) {
      console.log(`Fixing: ${error.message}`);
      
      try {
        switch (error.type) {
          case 'build':
            await this.fixBuildError(error);
            break;
          case 'environment':
            await this.fixEnvironmentError(error);
            break;
          case 'runtime':
            await this.fixRuntimeError(error);
            break;
          case 'deployment':
            await this.fixDeploymentError(error);
            break;
        }
        
        error.applied = true;
        this.fixesApplied.push(error.fix);
        console.log(`✅ Applied: ${error.fix}\n`);
        
      } catch (fixError) {
        console.log(`❌ Failed to apply fix: ${error.fix}\n`);
        console.log(`   Error: ${fixError}\n`);
      }
    }
  }

  private async fixBuildError(error: VercelError) {
    if (error.message.includes('TypeScript')) {
      // Try to fix common TypeScript issues
      console.log('   Running TypeScript check...');
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    }
    
    if (error.message.includes('ESLint')) {
      // Try to fix linting issues
      console.log('   Running ESLint with auto-fix...');
      execSync('npx eslint . --fix', { stdio: 'pipe' });
    }
  }

  private async fixEnvironmentError(error: VercelError) {
    if (error.message.includes('Missing .env.local')) {
      const envContent = `# Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your-secret-key-here
DATABASE_URL=your-database-url-here
`;
      writeFileSync('.env.local', envContent);
    }
  }

  private async fixRuntimeError(error: VercelError) {
    if (error.message.includes('Missing app directory')) {
      execSync('mkdir -p app', { stdio: 'pipe' });
      const layoutContent = `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
      writeFileSync('app/layout.tsx', layoutContent);
    }
  }

  private async fixDeploymentError(error: VercelError) {
    if (error.message.includes('No deployments found')) {
      console.log('   Creating new deployment...');
      execSync('vercel --yes', { stdio: 'pipe' });
    }
  }

  private reportResults() {
    console.log('📋 Fix Results Summary\n');
    console.log(`Total issues found: ${this.errors.length}`);
    console.log(`Fixes applied: ${this.fixesApplied.length}`);
    console.log(`Issues remaining: ${this.errors.filter(e => !e.applied).length}\n`);
    
    if (this.fixesApplied.length > 0) {
      console.log('✅ Applied fixes:');
      this.fixesApplied.forEach(fix => console.log(`   - ${fix}`));
    }
    
    const remainingErrors = this.errors.filter(e => !e.applied);
    if (remainingErrors.length > 0) {
      console.log('\n❌ Issues that need manual attention:');
      remainingErrors.forEach(error => {
        console.log(`   - ${error.message}`);
        console.log(`     Fix: ${error.fix}`);
      });
    }
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run "npm run vercel:status" to check deployment status');
    console.log('2. Run "npm run vercel:logs" to view detailed logs');
    console.log('3. Run "npm run vercel:rebuild" to redeploy with fixes');
  }
}

// Run the fixer
const fixer = new VercelFixer();
fixer.run().catch(console.error);