#!/usr/bin/env tsx

/**
 * Project Initialization Script
 * Sets up the SignatureQuoteAI project with all necessary configurations
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class ProjectInitializer {
  private projectRoot: string;
  private errors: string[] = [];
  private warnings: string[] = [];
  private successes: string[] = [];

  constructor() {
    this.projectRoot = process.cwd();
  }

  async run() {
    console.log('🚀 Initializing SignatureQuoteAI Project\n');
    console.log('=' .repeat(50));
    
    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Initialize project structure
      await this.initializeProjectStructure();
      
      // Setup environment variables
      await this.setupEnvironmentVariables();
      
      // Install dependencies
      await this.installDependencies();
      
      // Setup database
      await this.setupDatabase();
      
      // Setup Vercel
      await this.setupVercel();
      
      // Generate initial documentation
      await this.generateDocumentation();
      
      // Run initial build
      await this.runInitialBuild();
      
      // Report results
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    }
  }

  private async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...\n');
    
    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
      
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion < 18) {
        this.warnings.push('Node.js version should be 18 or higher for optimal performance');
      }
    } catch (error) {
      this.errors.push('Node.js not found. Please install Node.js 18+');
    }
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
      this.errors.push('npm not found. Please install npm');
    }
    
    // Check Vercel CLI
    try {
      const vercelVersion = execSync('vercel --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Vercel CLI: ${vercelVersion}`);
    } catch (error) {
      this.warnings.push('Vercel CLI not found. Install with: npm i -g vercel');
    }
    
    // Check Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Git: ${gitVersion}`);
    } catch (error) {
      this.warnings.push('Git not found. Please install Git for version control');
    }
  }

  private async initializeProjectStructure() {
    console.log('\n📁 Initializing project structure...\n');
    
    const directories = [
      'app/api',
      'app/(auth)',
      'components/ui',
      'lib/utils',
      'public/images',
      'docs',
      'scripts',
      'types'
    ];
    
    for (const dir of directories) {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
        this.successes.push(`Created directory: ${dir}`);
      } else {
        console.log(`ℹ️  Directory exists: ${dir}`);
      }
    }
  }

  private async setupEnvironmentVariables() {
    console.log('\n🌍 Setting up environment variables...\n');
    
    const envFiles = ['.env.local', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = join(this.projectRoot, envFile);
      
      if (!existsSync(envPath)) {
        let envContent = '';
        
        if (envFile === '.env.local') {
          envContent = `# Environment Variables for SignatureQuoteAI
# Copy this file and update with your actual values

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SignatureQuoteAI

# Authentication
AUTH_SECRET=your-secret-key-here
AUTH_GOOGLE_CLIENT_ID=your-google-client-id
AUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Database
DATABASE_URL=your-database-url-here
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=signaturequoteai

# Email Configuration
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_PROJECT_ID=your-project-id
VERCEL_ORG_ID=your-org-id

# Development
NODE_ENV=development
`;
        } else {
          envContent = `# Environment Variables Example
# Copy this file to .env.local and update with your actual values

NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your-secret-key-here
DATABASE_URL=your-database-url-here
# ... add other variables as needed
`;
        }
        
        writeFileSync(envPath, envContent);
        console.log(`✅ Created ${envFile}`);
        this.successes.push(`Created ${envFile}`);
      } else {
        console.log(`ℹ️  ${envFile} already exists`);
      }
    }
  }

  private async installDependencies() {
    console.log('\n📦 Installing dependencies...\n');
    
    try {
      console.log('Installing npm packages...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
      this.successes.push('Dependencies installed');
    } catch (error) {
      this.errors.push('Failed to install dependencies');
      console.error('❌ Failed to install dependencies:', error);
    }
  }

  private async setupDatabase() {
    console.log('\n🗄️ Setting up database...\n');
    
    try {
      // Check if Drizzle is configured
      if (existsSync('drizzle.config.ts')) {
        console.log('✅ Drizzle configuration found');
        
        // Generate initial migration
        try {
          execSync('npx drizzle-kit generate', { stdio: 'inherit' });
          console.log('✅ Database migration generated');
          this.successes.push('Database migration generated');
        } catch (error) {
          this.warnings.push('Could not generate database migration');
        }
      } else {
        this.warnings.push('Drizzle configuration not found. Database setup may be incomplete');
      }
    } catch (error) {
      this.warnings.push('Database setup encountered issues');
    }
  }

  private async setupVercel() {
    console.log('\n🚀 Setting up Vercel...\n');
    
    try {
      // Check if already linked to Vercel
      if (existsSync('.vercel/project.json')) {
        console.log('✅ Project already linked to Vercel');
        this.successes.push('Vercel project linked');
      } else {
        console.log('ℹ️  Project not linked to Vercel yet');
        console.log('💡 Run "vercel link" to connect to Vercel');
        this.warnings.push('Project not linked to Vercel. Run "vercel link" to connect');
      }
    } catch (error) {
      this.warnings.push('Could not check Vercel status');
    }
  }

  private async generateDocumentation() {
    console.log('\n📚 Generating documentation...\n');
    
    // Create basic README if it doesn't exist
    const readmePath = join(this.projectRoot, 'README.md');
    if (!existsSync(readmePath)) {
      const readmeContent = `# SignatureQuoteAI

A web application that crawls Signature Solar for current prices and generates polished quotes.

## Features

- 🔍 Product crawling from Signature Solar
- 📊 Quote generation and management
- 📧 Email integration
- 📄 PDF generation
- 🔐 User authentication
- 🚀 Vercel deployment

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run vercel:debug\` - Debug Vercel deployment

## Project Structure

\`\`\`
signaturequoteai/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                 # Utility functions
├── scripts/             # Build and utility scripts
├── docs/                # Documentation
└── public/              # Static assets
\`\`\`

## Deployment

This project is configured for deployment on Vercel.

1. Link to Vercel:
   \`\`\`bash
   vercel link
   \`\`\`

2. Deploy:
   \`\`\`bash
   vercel --prod
   \`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
`;
      
      writeFileSync(readmePath, readmeContent);
      console.log('✅ README.md created');
      this.successes.push('README.md created');
    } else {
      console.log('ℹ️  README.md already exists');
    }
  }

  private async runInitialBuild() {
    console.log('\n🔨 Running initial build...\n');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Initial build successful');
      this.successes.push('Initial build successful');
    } catch (error) {
      this.errors.push('Initial build failed');
      console.error('❌ Initial build failed:', error);
    }
  }

  private reportResults() {
    console.log('\n📋 Initialization Report\n');
    console.log('=' .repeat(50));
    
    if (this.successes.length > 0) {
      console.log('\n✅ Successes:');
      this.successes.forEach(success => console.log(`   - ${success}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Update .env.local with your actual values');
    console.log('2. Run "vercel link" to connect to Vercel');
    console.log('3. Run "npm run dev" to start development');
    console.log('4. Run "npm run vercel:debug" to check deployment status');
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Project initialization completed successfully!');
    } else {
      console.log('\n⚠️  Project initialization completed with errors. Please fix the errors above.');
    }
  }
}

// Run the initializer
const initializer = new ProjectInitializer();
initializer.run().catch(console.error);