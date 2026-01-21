import OpenAI from 'openai';
import type { HeroCommentary, HeroCategory } from '../../models/types';
import { NOTABLE_HEROES, type NotableHero } from '../battle/heroGenerator';

// OpenRouter API base URL
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

// Create OpenRouter client
function createClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'HTTP-Referer': 'https://keizai.app',
      'X-Title': 'Keizai Writing Mode',
    },
  });
}

// Generate unique ID
function generateId(): string {
  return 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Build prompt for hero commentary on writing
function buildCommentaryPrompt(
  hero: NotableHero,
  title: string,
  content: string,
  mood?: string
): string {
  const moodContext = mood
    ? `\n(The writer was feeling: ${mood})\n`
    : '';

  return `You are ${hero.name}, ${hero.description}

Your traits: ${hero.traits.join(', ')}
Your special wisdom: "${hero.wisdom}"
Your speaking style: ${hero.speechStyle}

A person has written the following in their personal journal:
${moodContext}
Title: "${title}"

---
${content}
---

As ${hero.name}, read this writing thoughtfully and offer your perspective. Provide:

1. Your commentary on what they've written (2-3 paragraphs, in your authentic voice)
   - Acknowledge what you observe in their writing
   - Share relevant wisdom from your perspective
   - Be supportive but also offer insight

2. If a particular phrase or sentence stands out, you may quote it

3. A key reflection (one memorable sentence that captures your main thought)

4. A question for them to consider (something that might deepen their thinking)

Remember:
- Speak as ${hero.name} would speak
- Draw from your unique wisdom and life experience
- Be compassionate and supportive
- Offer perspective, not judgment
- The writing is personal - treat it with care

Respond in JSON format:
{
  "commentary": "Your 2-3 paragraph response in character...",
  "highlightedQuote": "A quote from their writing that stood out (or null if nothing specific)",
  "keyReflection": "One memorable sentence summarizing your main thought",
  "questionToConsider": "A thoughtful question for them to ponder"
}`;
}

// Get hero by name
export function getHeroByName(name: string): NotableHero | null {
  const normalized = name.toLowerCase().trim();

  for (const [key, hero] of Object.entries(NOTABLE_HEROES)) {
    if (key === normalized ||
        hero.name.toLowerCase() === normalized ||
        (hero.historicalFigure && hero.historicalFigure.toLowerCase() === normalized)) {
      return hero;
    }
  }

  return null;
}

// Get all heroes organized by category
export function getAllHeroesByCategory(): Record<HeroCategory, NotableHero[]> {
  const result: Record<HeroCategory, NotableHero[]> = {
    philosophers: [],
    mythology: [],
    warriors: [],
    healers: [],
    literary: [],
    modern: [],
  };

  for (const hero of Object.values(NOTABLE_HEROES)) {
    result[hero.category].push(hero);
  }

  return result;
}

// Maximum content length (prevents excessive API costs)
const MAX_CONTENT_LENGTH = 8000;

// Request commentary from a hero on user's writing
export async function requestHeroCommentary(
  heroName: string,
  title: string,
  content: string,
  apiKey: string,
  mood?: string
): Promise<HeroCommentary | null> {
  const hero = getHeroByName(heroName);
  if (!hero) {
    console.error(`[HeroCommentary] Hero not found: ${heroName}`);
    return null;
  }

  // Don't process empty content
  if (!content.trim()) {
    console.warn('[HeroCommentary] No content to comment on');
    return null;
  }

  // Truncate very long content to prevent excessive API costs
  let truncatedContent = content;
  if (content.length > MAX_CONTENT_LENGTH) {
    truncatedContent = content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated for length...]';
    console.warn(`[HeroCommentary] Content truncated from ${content.length} to ${MAX_CONTENT_LENGTH} chars`);
  }

  const client = createClient(apiKey);
  const prompt = buildCommentaryPrompt(hero, title, truncatedContent, mood);

  console.log('[HeroCommentary] Making request to OpenRouter...', {
    model: DEFAULT_MODEL,
    heroName: hero.name,
    contentLength: truncatedContent.length,
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey.length,
  });

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1024,
      temperature: 0.8,
    });

    console.log('[HeroCommentary] Got response from OpenRouter', {
      hasChoices: !!response.choices?.length,
      choicesCount: response.choices?.length,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      console.error('[HeroCommentary] No response from LLM');
      return null;
    }

    // Parse JSON response - handle potential markdown code blocks
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    // Parse with specific error handling for malformed JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[HeroCommentary] Failed to parse JSON response:', jsonText.substring(0, 200));
      throw new Error('Hero response was malformed. Please try again.');
    }

    // Validate required fields exist and are strings
    if (!parsed.commentary || typeof parsed.commentary !== 'string') {
      console.error('[HeroCommentary] Invalid response: missing or invalid commentary field');
      throw new Error('Hero response was incomplete. Please try again.');
    }
    if (!parsed.keyReflection || typeof parsed.keyReflection !== 'string') {
      console.error('[HeroCommentary] Invalid response: missing or invalid keyReflection field');
      throw new Error('Hero response was incomplete. Please try again.');
    }

    return {
      id: generateId(),
      heroName: hero.name,
      heroCategory: hero.category,
      commentary: parsed.commentary,
      highlightedQuote: typeof parsed.highlightedQuote === 'string' ? parsed.highlightedQuote : undefined,
      keyReflection: parsed.keyReflection,
      questionToConsider: typeof parsed.questionToConsider === 'string' ? parsed.questionToConsider : undefined,
      requestedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error('[HeroCommentary] Error getting commentary:', error);

    // Extract error message from various error formats
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // OpenAI SDK errors often have additional info
      const anyError = error as { status?: number; error?: { message?: string } };
      if (anyError.status === 402 || anyError.error?.message?.includes('credits')) {
        errorMessage = 'Insufficient credits. Add credits at openrouter.ai/settings/credits';
      } else if (anyError.error?.message) {
        errorMessage = anyError.error.message;
      }
    } else if (typeof error === 'object' && error !== null) {
      const obj = error as { message?: string; error?: { message?: string } };
      errorMessage = obj.error?.message || obj.message || JSON.stringify(error);
    }

    throw new Error(errorMessage);
  }
}

// Get suggested heroes based on writing content keywords
export function getSuggestedHeroes(content: string): NotableHero[] {
  const lowercaseContent = content.toLowerCase();
  const suggestions: NotableHero[] = [];

  // Keyword to hero mapping (keys must match NOTABLE_HEROES keys exactly)
  // Valid heroes: marcus aurelius, socrates, carl jung, buddha, lao tzu, seneca,
  // athena, apollo, kuan yin, odin, thoth, brigid, joan of arc, odysseus,
  // miyamoto musashi, boudica, mr rogers, florence nightingale, thich nhat hanh,
  // mother teresa, gandalf, samwise, atticus finch, iroh, brene brown, carl rogers,
  // maya angelou, mr beast
  const keywordMappings: Record<string, string[]> = {
    anxiety: ['thich nhat hanh', 'buddha', 'seneca'],
    fear: ['marcus aurelius', 'athena', 'gandalf'],
    anger: ['buddha', 'marcus aurelius', 'mr rogers'],
    sadness: ['mr rogers', 'carl jung', 'maya angelou'],
    grief: ['thich nhat hanh', 'gandalf', 'kuan yin'],
    stress: ['seneca', 'thich nhat hanh', 'buddha'],
    love: ['mr rogers', 'kuan yin', 'maya angelou'],
    work: ['marcus aurelius', 'athena', 'seneca'],
    relationship: ['mr rogers', 'brene brown', 'carl rogers'],
    decision: ['athena', 'gandalf', 'socrates'],
    creativity: ['maya angelou', 'apollo', 'lao tzu'],
    purpose: ['marcus aurelius', 'gandalf', 'athena'],
    growth: ['buddha', 'gandalf', 'iroh'],
    failure: ['seneca', 'marcus aurelius', 'brene brown'],
    success: ['athena', 'miyamoto musashi', 'marcus aurelius'],
    conflict: ['gandalf', 'mr rogers', 'iroh'],
    peace: ['buddha', 'thich nhat hanh', 'gandalf'],
    wisdom: ['gandalf', 'athena', 'iroh'],
    courage: ['joan of arc', 'athena', 'boudica'],
    hope: ['gandalf', 'mr rogers', 'samwise'],
  };

  const suggestedKeys = new Set<string>();

  for (const [keyword, heroKeys] of Object.entries(keywordMappings)) {
    if (lowercaseContent.includes(keyword)) {
      heroKeys.forEach(key => suggestedKeys.add(key));
    }
  }

  // Convert keys to heroes
  for (const key of suggestedKeys) {
    const hero = NOTABLE_HEROES[key as keyof typeof NOTABLE_HEROES];
    if (hero && !suggestions.includes(hero)) {
      suggestions.push(hero);
    }
  }

  // If no specific keywords found, suggest some default heroes
  if (suggestions.length === 0) {
    const defaults = ['marcus aurelius', 'gandalf', 'mr rogers', 'buddha'];
    defaults.forEach(key => {
      const hero = NOTABLE_HEROES[key as keyof typeof NOTABLE_HEROES];
      if (hero) suggestions.push(hero);
    });
  }

  // Limit to top 6
  return suggestions.slice(0, 6);
}
