/**
 * ChatGPT MCP Client - Lightweight wrapper for OpenAI Chat Completions
 * Implements error analysis with strict JSON output validation
 */

import OpenAI from 'openai';
import { z } from 'zod';

// Response schema with strict validation
const AnalysisResponseSchema = z.object({
  summary: z.string().min(10),
  rootCause: z.string().min(10),
  fixPlan: z.string().min(10),
  patches: z.array(z.object({
    path: z.string(),
    before: z.string().optional(),
    after: z.string().optional(),
    replacement: z.string().optional(),
    startLine: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
  })),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

export interface AnalyzeErrorInput {
  title: string;
  logs?: string;
  files?: Array<{ path: string; content: string }>;
  question?: string;
}

/**
 * Initialize OpenAI client with API key from environment
 */
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

/**
 * Get model name from environment or use default
 */
function getModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

/**
 * Analyze error logs and code files, return structured fix plan
 *
 * @param input - Error context including logs and file contents
 * @returns Structured analysis with patches
 */
export async function analyzeError(input: AnalyzeErrorInput): Promise<AnalysisResponse> {
  const client = getClient();
  const model = getModel();

  // Build context from inputs
  const contextParts: string[] = [];

  if (input.logs) {
    contextParts.push(`## Error Logs\n\`\`\`\n${input.logs}\n\`\`\``);
  }

  if (input.files && input.files.length > 0) {
    contextParts.push('\n## Relevant Code Files');
    input.files.forEach(file => {
      contextParts.push(`\n### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``);
    });
  }

  const userPrompt = `
${input.title}

${contextParts.join('\n')}

${input.question ? `\n## Question\n${input.question}` : ''}

Analyze the error above and provide:
1. A brief summary of what went wrong
2. The root cause with exact file/line references when possible
3. A step-by-step fix plan
4. Minimal code patches to apply

**IMPORTANT**: Respond ONLY with valid JSON matching this schema:
{
  "summary": "string",
  "rootCause": "string",
  "fixPlan": "string",
  "patches": [
    {
      "path": "string",
      "replacement": "string (full file content)",
      "startLine": number (optional, for partial replacement),
      "endLine": number (optional, for partial replacement)
    }
  ]
}

Rules for patches:
- Never invent files that don't exist
- Keep patches minimal and safe
- Use startLine/endLine for partial replacements
- Use full "replacement" for complete file rewrites
- Reference exact file paths from the provided context
`.trim();

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert debugging assistant. Analyze errors and provide precise, minimal fixes in strict JSON format. Never include explanatory text outside the JSON structure.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse and validate JSON response
      const parsed = JSON.parse(responseText);
      const validated = AnalysisResponseSchema.parse(parsed);

      return validated;

    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Failed to get valid response after ${maxAttempts} attempts: ${error}`);
      }

      console.warn(`Attempt ${attempt} failed, retrying with stricter JSON-only reminder...`);
      userPrompt += '\n\n**REMINDER**: Output MUST be valid JSON only, no markdown, no extra text.';
    }
  }

  // TypeScript needs this even though we throw above
  throw new Error('Unreachable');
}

/**
 * Quick health check - verify API key is valid
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getClient();
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

// Deployment analysis schema with environment advice
const DeploymentAnalysisSchema = z.object({
  summary: z.string().min(10),
  rootCause: z.string().min(10),
  fixPlan: z.string().min(10),
  patches: z.array(z.object({
    path: z.string(),
    replacement: z.string().optional(),
    startLine: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
  })),
  envAdvice: z.object({
    required: z.array(z.string()),
    optional: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type DeploymentAnalysis = z.infer<typeof DeploymentAnalysisSchema>;

export interface AnalyzeDeploymentInput {
  title: string;
  logs?: string;
  files?: Array<{ path: string; content: string }>;
  claudeContext?: string;
  question?: string;
}

/**
 * Analyze deployment errors with Vercel-specific context
 */
export async function analyzeDeployment(input: AnalyzeDeploymentInput): Promise<DeploymentAnalysis> {
  const client = getClient();
  const model = getModel();

  const contextParts: string[] = [];

  if (input.claudeContext) {
    contextParts.push(`## Project Context (from claude.md)\n${input.claudeContext}`);
  }

  if (input.logs) {
    contextParts.push(`\n## Build/Deployment Logs\n\`\`\`\n${input.logs}\n\`\`\``);
  }

  if (input.files && input.files.length > 0) {
    contextParts.push('\n## Repository Files');
    input.files.forEach(file => {
      contextParts.push(`\n### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``);
    });
  }

  const userPrompt = `
${input.title}

${contextParts.join('\n')}

${input.question ? `\n## Additional Context\n${input.question}` : ''}

You are a Vercel deployment doctor. Analyze this deployment failure and provide:

1. **Summary**: Brief description of what went wrong
2. **Root Cause**: Concrete cause with file/line references
3. **Fix Plan**: Minimal steps to resolve
4. **Patches**: Smallest safe code edits
5. **Environment Advice**: Scan code for process.env.* usage and identify:
   - Required environment variables
   - Optional environment variables
   - Notes about runtime (Node/Edge), Next.js config, image domains, experimental flags
   - Prisma/Playwright/Puppeteer deployment caveats
   - SWC/Node version compatibility issues

**IMPORTANT**: Respond ONLY with valid JSON matching this schema:
{
  "summary": "string",
  "rootCause": "string",
  "fixPlan": "string",
  "patches": [
    {
      "path": "string",
      "replacement": "string (full or partial)",
      "startLine": number (optional),
      "endLine": number (optional)
    }
  ],
  "envAdvice": {
    "required": ["ENV_VAR_1", "ENV_VAR_2"],
    "optional": ["OPTIONAL_VAR"],
    "notes": "Runtime/config notes"
  }
}

Rules:
- Never invent files that don't exist
- Keep patches minimal and safe
- Scan all files for process.env usage
- Check for Next.js runtime compatibility (Node vs Edge)
- Look for common Vercel pitfalls (missing domains, wrong Node version, etc.)
`.trim();

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a Vercel deployment expert. Analyze failures, provide minimal fixes, and identify environment requirements. Output strict JSON only.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(responseText);
      const validated = DeploymentAnalysisSchema.parse(parsed);

      return validated;

    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Failed to get valid response after ${maxAttempts} attempts: ${error}`);
      }

      console.warn(`Attempt ${attempt} failed, retrying...`);
    }
  }

  throw new Error('Unreachable');
}
