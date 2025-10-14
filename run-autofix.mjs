#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Simple auto-fix runner - load .env file
let apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  const match = envContent.match(/OPENAI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not set');
  process.exit(1);
}

console.log('🔧 Vercel Auto-Fix starting...\n');

// Create directories
['logs', 'reports', 'backups'].forEach(dir => {
  mkdirSync(`.mcp/${dir}`, { recursive: true });
});

// Run build and capture error
console.log('🏗️  Running: npm run build');
let buildOutput = '';
try {
  execSync('npm run build', { encoding: 'utf-8' });
  console.log('✅ Build succeeded - no errors');
  process.exit(0);
} catch (error) {
  buildOutput = error.stdout + '\n' + error.stderr;
  console.log('❌ Build failed - capturing error...\n');
}

// Save log
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = `.mcp/logs/${timestamp}.log`;
writeFileSync(logPath, buildOutput, 'utf-8');

// Extract error
const errorLines = buildOutput.split('\n').filter(line =>
  line.includes('Error') || line.includes('⨯') || line.includes('⚠')
).join('\n');

console.log('📊 Error Detected:');
console.log(errorLines);
console.log('\n🤖 Sending to ChatGPT for analysis...\n');

// Call OpenAI
const payload = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a Vercel deployment expert. Analyze build failures and provide solutions in JSON format: { "summary": "...", "rootCause": "...", "solution": "..." }'
    },
    {
      role: 'user',
      content: `Vercel Build Failure Analysis:

## Error Output:
${buildOutput.slice(-2000)}

## Package.json:
${readFileSync('package.json', 'utf-8')}

Provide a JSON response with:
1. summary: Brief description
2. rootCause: Exact cause with file references
3. solution: Step-by-step fix (shell commands)

Focus on: SWC binaries, dependencies, Vercel compatibility.`
    }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.1
};

// Make API call
const response = execSync(`curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${apiKey}" \
  -d '${JSON.stringify(payload).replace(/'/g, "'\\''")}'`,
  { encoding: 'utf-8' }
);

const result = JSON.parse(response);
if (!result.choices || result.error) {
  console.error('❌ OpenAI API Error:', result.error || 'No choices returned');
  console.error('Response:', response.slice(0, 500));
  process.exit(1);
}
const analysis = JSON.parse(result.choices[0].message.content);

console.log('📋 Analysis Complete:\n');
console.log(`Summary: ${analysis.summary}`);
console.log(`\nRoot Cause: ${analysis.rootCause}`);
console.log(`\nSolution:\n${analysis.solution}`);

// Save report
const report = `# Vercel Auto-Fix Report
Generated: ${new Date().toISOString()}

## Root Cause
${analysis.rootCause}

## Solution
${analysis.solution}

## Build Output
\`\`\`
${buildOutput.slice(-500)}
\`\`\`
`;

writeFileSync(`.mcp/reports/${timestamp}.md`, report, 'utf-8');
console.log(`\n📄 Report saved: .mcp/reports/${timestamp}.md`);

console.log('\n✨ Analysis complete! Review the solution above.\n');
