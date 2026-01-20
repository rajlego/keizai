import Anthropic from '@anthropic-ai/sdk';
import type { Part, PartPersonality, Relationship, Commitment, ConversationMessage } from '../../models/types';
import { buildSystemPrompt, buildChoicesPrompt, buildDebatePrompt, buildPersonalityGenerationPrompt, type PartContext } from './prompts';

// Default model to use
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// LLM service configuration
export interface LLMConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

// Create Anthropic client
function createClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });
}

// Build context object for a part
export function buildPartContext(
  part: Part,
  personality: PartPersonality | null,
  relationship: Relationship | null,
  activeCommitments: Commitment[],
  recentMessages: ConversationMessage[]
): PartContext {
  return {
    part,
    personality,
    relationship,
    activeCommitments,
    recentMessages,
  };
}

// Chat with a part - returns full response
export async function chat(
  context: PartContext,
  userMessage: string,
  config: LLMConfig
): Promise<string> {
  const client = createClient(config.apiKey);
  const systemPrompt = buildSystemPrompt(context);

  try {
    const response = await client.messages.create({
      model: config.model ?? DEFAULT_MODEL,
      max_tokens: config.maxTokens ?? 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  } catch (error) {
    console.error('[LLM] Chat error:', error);
    throw error;
  }
}

// Chat with streaming response
export async function* chatStream(
  context: PartContext,
  userMessage: string,
  config: LLMConfig
): AsyncGenerator<string, void, unknown> {
  const client = createClient(config.apiKey);
  const systemPrompt = buildSystemPrompt(context);

  try {
    const stream = await client.messages.stream({
      model: config.model ?? DEFAULT_MODEL,
      max_tokens: config.maxTokens ?? 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error('[LLM] Stream error:', error);
    throw error;
  }
}

// Generate response choices for the user
export async function generateChoices(
  context: PartContext,
  partMessage: string,
  config: LLMConfig
): Promise<string[]> {
  const client = createClient(config.apiKey);
  const prompt = buildChoicesPrompt(partMessage, context);

  try {
    const response = await client.messages.create({
      model: config.model ?? DEFAULT_MODEL,
      max_tokens: 200,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '[]';

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return ['Continue the conversation', 'Ask a question', 'Change the subject'];
  } catch (error) {
    console.error('[LLM] Generate choices error:', error);
    return ['Continue the conversation', 'Ask a question', 'Change the subject'];
  }
}

// Debate between two parts
export async function* debate(
  part1Context: PartContext,
  part2Context: PartContext,
  topic: string,
  config: LLMConfig,
  turns = 4
): AsyncGenerator<{ partId: string; content: string }, void, unknown> {
  const client = createClient(config.apiKey);

  let currentSpeaker: 'part1' | 'part2' = 'part1';
  const history: string[] = [];

  for (let i = 0; i < turns; i++) {
    const context = currentSpeaker === 'part1' ? part1Context : part2Context;
    const prompt = buildDebatePrompt(part1Context, part2Context, topic, currentSpeaker);

    // Include conversation history
    const fullPrompt = history.length > 0
      ? `${prompt}\n\nConversation so far:\n${history.join('\n')}\n\nYour response:`
      : prompt;

    try {
      const response = await client.messages.create({
        model: config.model ?? DEFAULT_MODEL,
        max_tokens: 150,
        messages: [
          { role: 'user', content: fullPrompt }
        ],
      });

      const textBlock = response.content.find(block => block.type === 'text');
      const content = textBlock?.type === 'text' ? textBlock.text : '';

      history.push(`${context.part.name}: ${content}`);

      yield {
        partId: context.part.id,
        content,
      };

      // Switch speaker
      currentSpeaker = currentSpeaker === 'part1' ? 'part2' : 'part1';
    } catch (error) {
      console.error('[LLM] Debate error:', error);
      throw error;
    }
  }
}

// Auto-generate personality for a part
export async function generatePersonality(
  part: Part,
  config: LLMConfig
): Promise<{ traits: string[]; speechStyle: string; coreNeed: string }> {
  const client = createClient(config.apiKey);
  const prompt = buildPersonalityGenerationPrompt(part);

  try {
    const response = await client.messages.create({
      model: config.model ?? DEFAULT_MODEL,
      max_tokens: 200,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '{}';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        traits: parsed.traits ?? [],
        speechStyle: parsed.speechStyle ?? '',
        coreNeed: parsed.coreNeed ?? '',
      };
    }

    // Fallback
    return {
      traits: ['curious', 'expressive'],
      speechStyle: 'speaks naturally and openly',
      coreNeed: 'to be understood',
    };
  } catch (error) {
    console.error('[LLM] Generate personality error:', error);
    return {
      traits: ['curious', 'expressive'],
      speechStyle: 'speaks naturally and openly',
      coreNeed: 'to be understood',
    };
  }
}

// Test API key
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = createClient(apiKey);
    await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }],
    });
    return true;
  } catch {
    return false;
  }
}
