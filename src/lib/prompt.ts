import type { PRContext, DescriptionStyle } from './types';
import type { ChatMessage } from './openrouter';

export interface PromptOptions {
  style: DescriptionStyle;
  generateTitle: boolean;
  customPrompt: string;
}

const STYLE_INSTRUCTIONS: Record<DescriptionStyle, string> = {
  short: `DETAIL LEVEL: SHORT
- 2–3 sentence high-level overview of the change and its purpose
- Bullet list of key changes
- Each bullet should be a single, clear line`,
  medium: `DETAIL LEVEL: MEDIUM
- One short summary paragraph describing the change and motivation
- Bullet list including:
  - Affected file names or modules
  - Major changes per file/module
  - Why each change was necessary or beneficial`,
  detailed: `DETAIL LEVEL: LARGE
- Clear summary at the top
- Include the following sections when applicable:
  - Context / Problem statement
  - Solution overview
  - Before vs After behavior
  - File-level or component-level breakdown
  - Technical or architectural notes
  - Testing performed / verification steps
  - Potential risks or breaking changes
- Include a simple diagram or ASCII flow if it helps explain logic or architecture`,
};

export function buildPrompt(
  context: PRContext,
  options: PromptOptions
): ChatMessage[] {
  const systemPrompt = buildSystemPrompt(options);
  const userPrompt = buildUserPrompt(context, options);

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function buildSystemPrompt(options: PromptOptions): string {
  const titleInstruction = options.generateTitle
    ? `\n\nYou must also generate a concise PR title. Format your response as:
TITLE: <your suggested title here>

DESCRIPTION:
<your description here>`
    : '';

  if (options.customPrompt.trim()) {
    return options.customPrompt.trim() + titleInstruction;
  }

  return `You are a helpful assistant that writes clear, professional, industry-standard GitHub pull request descriptions.

GOAL
Produce reviewer-friendly PR titles and descriptions that clearly explain WHAT changed and WHY, following common GitHub PR template best practices.

GENERAL RULES
- Use Markdown formatting
- Use present tense and imperative mood (e.g., "Add validation", not "Added validation")
- Be concise, clear, and technical
- Avoid pleasantries and filler text
- Do not mention that you are an AI
- Infer intent from filenames, code patterns, and diffs if full context is missing
- Optimize for fast code review and long-term maintainability

${STYLE_INSTRUCTIONS[options.style]}

CONTENT GUIDELINES
- Focus on "what changed" and "why it changed"
- Assume the reviewer has not seen the diff yet
- Prefer bullet points over long paragraphs
- Call out important design decisions or trade-offs
- Follow common GitHub PR template structure (summary, changes, testing, references)

If information is missing, make reasonable assumptions and clearly describe what can be inferred.${titleInstruction}`;
}

function buildUserPrompt(context: PRContext, _options: PromptOptions): string {
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

export function parseGeneratedResponse(
  response: string,
  includesTitle: boolean
): { title?: string; description: string } {
  if (!includesTitle) {
    return { description: response.trim() };
  }

  const titleMatch = response.match(/^TITLE:\s*(.+?)(?:\n|$)/i);
  const descriptionMatch = response.match(/DESCRIPTION:\s*([\s\S]*)/i);

  if (titleMatch && descriptionMatch) {
    return {
      title: titleMatch[1].trim(),
      description: descriptionMatch[1].trim(),
    };
  }

  const lines = response.split('\n');
  const firstLine = lines[0]?.trim();
  
  if (firstLine && !firstLine.startsWith('#') && firstLine.length < 100) {
    return {
      title: firstLine,
      description: lines.slice(1).join('\n').trim(),
    };
  }

  return { description: response.trim() };
}
