import type { PRContext, DescriptionStyle } from './types';
import type { ChatMessage } from './openrouter';

const STYLE_INSTRUCTIONS: Record<DescriptionStyle, string> = {
  short: `Write a brief PR description in 2-3 sentences. Focus only on the main change and its purpose.`,
  medium: `Write a balanced PR description with:
- A brief summary (1-2 sentences)
- Key changes as bullet points
- Any notable implementation details`,
  detailed: `Write a comprehensive PR description with:
- A clear summary of what this PR does
- Detailed breakdown of all changes
- Technical implementation notes
- Any breaking changes or migration notes
- Testing considerations`,
};

export function buildPrompt(
  context: PRContext,
  style: DescriptionStyle
): ChatMessage[] {
  const systemPrompt = buildSystemPrompt(style);
  const userPrompt = buildUserPrompt(context);

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function buildSystemPrompt(style: DescriptionStyle): string {
  return `You are a helpful assistant that writes clear, professional GitHub pull request descriptions.

${STYLE_INSTRUCTIONS[style]}

Guidelines:
- Use Markdown formatting
- Be concise and precise
- Focus on WHAT changed and WHY
- Don't include unnecessary pleasantries
- Don't mention that you're an AI
- If the changes are unclear, describe what you can infer from the diff
- Use present tense ("Adds feature" not "Added feature")`;
}

function buildUserPrompt(context: PRContext): string {
  const parts: string[] = [];

  parts.push(`# Pull Request Information`);

  if (context.title) {
    parts.push(`\n## Title\n${context.title}`);
  }

  if (context.baseBranch && context.headBranch) {
    parts.push(`\n## Branches\n${context.headBranch} → ${context.baseBranch}`);
  }

  if (context.labels.length > 0) {
    parts.push(`\n## Labels\n${context.labels.join(', ')}`);
  }

  if (context.commits.length > 0) {
    parts.push(`\n## Commits\n${context.commits.map((c) => `- ${c}`).join('\n')}`);
  }

  if (context.diff) {
    parts.push(`\n## Diff\n\`\`\`diff\n${context.diff}\n\`\`\``);
  }

  if (context.files && context.files.length > 0) {
    const filesList = context.files
      .map((f) => `- ${f.filename} (+${f.additions} -${f.deletions})`)
      .join('\n');
    parts.push(`\n## Files Changed\n${filesList}`);
  }

  if (context.existingDescription) {
    parts.push(`\n## Existing Description (for context)\n${context.existingDescription}`);
  }

  if (context.usedFallback) {
    parts.push(`\n---\n\n**Note:** Full diff not available (limited context from page). Please write a PR description based on the commits and file changes above.`);
  } else {
    parts.push(`\n---\n\nPlease write a PR description based on the information above.`);
  }

  return parts.join('\n');
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
