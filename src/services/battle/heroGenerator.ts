import OpenAI from 'openai';
import type { BattleCharacter, HeroArchetype } from '../../models/types';
import { HERO_ARCHETYPES } from '../../models/types';

// OpenRouter API base URL
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

interface HeroGenerationInput {
  scenario: string;
  villainName: string;
  villainDescription: string;
  request: string; // What the user asked for (e.g., "Marcus Aurelius" or "a wise grandmother")
  existingHeroes: BattleCharacter[];
}

interface GeneratedHero {
  name: string;
  archetype: HeroArchetype;
  description: string;
  traits: string[];
  specialAbility: string;
  speechStyle: string;
  wisdom: string;
  avatarPrompt: string;
  historicalFigure?: string;
}

// Create OpenRouter client
function createClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'HTTP-Referer': 'https://keizai.app',
      'X-Title': 'Keizai IFS Battle',
    },
  });
}

// Build the hero generation prompt
function buildHeroPrompt(input: HeroGenerationInput): string {
  const existingHeroesDesc = input.existingHeroes.length > 0
    ? input.existingHeroes.map(h => `- ${h.name} (${h.archetype ?? 'custom'}): ${h.description}`).join('\n')
    : 'None yet';

  const archetypesList = Object.entries(HERO_ARCHETYPES)
    .filter(([key]) => key !== 'custom')
    .map(([key, def]) => `- ${key}: ${def.description}`)
    .join('\n');

  return `You are summoning a Hero to help in an IFS (Internal Family Systems) therapeutic battle.

The scenario: "${input.scenario}"
The villain: ${input.villainName} - ${input.villainDescription}

The user requested: "${input.request}"

Existing heroes on the team:
${existingHeroesDesc}

Available archetypes:
${archetypesList}

Create a hero that:
1. Matches what the user requested (if historical/mythical figure, stay true to their known character)
2. Has strengths that complement the existing team
3. Brings unique wisdom relevant to THIS specific challenge
4. Has a distinct personality and speaking style

Return ONLY a JSON object in this exact format:
{
  "name": "hero name",
  "archetype": "closest matching archetype from the list (saber, archer, lancer, caster, rider, assassin, berserker, shielder, ruler, or custom)",
  "description": "who this hero is and why they can help (2-3 sentences)",
  "traits": ["trait1", "trait2", "trait3"],
  "specialAbility": "unique power or insight they offer in battle",
  "speechStyle": "how they speak (e.g., 'calm Stoic philosopher')",
  "wisdom": "key insight relevant to this specific battle",
  "avatarPrompt": "visual description for pixel art, heroic and distinctive",
  "historicalFigure": "if based on real/mythical figure, their name; otherwise null"
}`;
}

// Generate a custom hero from a user request
export async function generateHero(
  input: HeroGenerationInput,
  apiKey: string
): Promise<GeneratedHero> {
  const client = createClient(apiKey);
  const prompt = buildHeroPrompt(input);

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? '{}';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name ?? 'Mysterious Ally',
        archetype: isValidArchetype(parsed.archetype) ? parsed.archetype : 'custom',
        description: parsed.description ?? 'A hero who has come to help.',
        traits: parsed.traits ?? ['wise', 'supportive', 'brave'],
        specialAbility: parsed.specialAbility ?? 'Inner Strength - inspires courage in allies',
        speechStyle: parsed.speechStyle ?? 'speaks with calm wisdom',
        wisdom: parsed.wisdom ?? 'Every challenge is an opportunity for growth.',
        avatarPrompt: parsed.avatarPrompt ?? 'heroic figure in flowing robes, wise eyes, pixel art style',
        historicalFigure: parsed.historicalFigure ?? undefined,
      };
    }

    // Fallback
    return getDefaultHero(input.request);
  } catch (error) {
    console.error('[Battle] Hero generation error:', error);
    return getDefaultHero(input.request);
  }
}

// Check if archetype is valid
function isValidArchetype(value: string): value is HeroArchetype {
  return value in HERO_ARCHETYPES;
}

// Default hero if generation fails
function getDefaultHero(_request: string): GeneratedHero {
  return {
    name: 'The Wise Guide',
    archetype: 'caster',
    description: 'A wise mentor figure who sees clearly through confusion and offers guidance.',
    traits: ['wise', 'patient', 'compassionate'],
    specialAbility: 'Clear Sight - reveals hidden truths and motivations',
    speechStyle: 'speaks gently but with conviction',
    wisdom: 'Understanding comes before change.',
    avatarPrompt: 'wise mentor in flowing robes, gentle eyes, magical aura, pixel art style',
  };
}

// Create a hero from a predefined archetype
export function createArchetypeHero(archetype: HeroArchetype): Omit<BattleCharacter, 'id' | 'createdAt'> {
  const definition = HERO_ARCHETYPES[archetype];

  return {
    name: definition.name,
    role: 'hero',
    archetype,
    health: 100,
    maxHealth: 100,
    understanding: 0,
    trust: 0,
    description: definition.description,
    traits: [...definition.traits],
    coreNeed: `To ${definition.specialAbility.toLowerCase().split(' - ')[1] ?? 'help in battle'}`,
    speechStyle: definition.voiceStyle,
    avatarPrompt: definition.avatarPrompt,
  };
}

// Convert generated hero to BattleCharacter (partial - needs id and createdAt)
export function toHeroCharacter(generated: GeneratedHero): Omit<BattleCharacter, 'id' | 'createdAt'> {
  return {
    name: generated.name,
    role: 'hero',
    archetype: generated.archetype,
    health: 100,
    maxHealth: 100,
    understanding: 0,
    trust: 0,
    description: generated.description,
    traits: generated.traits,
    coreNeed: generated.wisdom,
    speechStyle: generated.speechStyle,
    avatarPrompt: generated.avatarPrompt,
    historicalFigure: generated.historicalFigure,
  };
}

// Well-known historical/mythical figures with pre-defined characteristics
export const NOTABLE_HEROES: Record<string, GeneratedHero> = {
  'marcus aurelius': {
    name: 'Marcus Aurelius',
    archetype: 'ruler',
    description: 'The philosopher-emperor who mastered his own mind through Stoic wisdom.',
    traits: ['stoic', 'disciplined', 'wise', 'humble'],
    specialAbility: 'Meditations - grants inner peace and clarity in chaos',
    speechStyle: 'speaks in measured, philosophical tones, often in questions',
    wisdom: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    avatarPrompt: 'roman emperor in purple toga, laurel wreath, philosophical gaze, scroll in hand, pixel art style',
    historicalFigure: 'Marcus Aurelius',
  },
  'athena': {
    name: 'Athena',
    archetype: 'saber',
    description: 'Greek goddess of wisdom and strategic warfare, who fights with intelligence.',
    traits: ['wise', 'strategic', 'just', 'protective'],
    specialAbility: 'Aegis Shield - protects allies while revealing enemy weaknesses',
    speechStyle: 'speaks with commanding authority and sharp insight',
    wisdom: 'True victory comes through wisdom, not mere force.',
    avatarPrompt: 'greek goddess in armor with owl on shoulder, helmet with plume, spear and shield, pixel art style',
    historicalFigure: 'Athena',
  },
  'gandalf': {
    name: 'Gandalf',
    archetype: 'caster',
    description: 'A wise wizard who guides heroes through their darkest moments.',
    traits: ['wise', 'patient', 'powerful', 'mysterious'],
    specialAbility: 'You Shall Not Pass - creates impenetrable boundaries against darkness',
    speechStyle: 'speaks with warmth that belies great power, often cryptically wise',
    wisdom: 'All we have to decide is what to do with the time that is given us.',
    avatarPrompt: 'grey wizard with pointed hat, long beard, staff with glowing crystal, pixel art style',
    historicalFigure: 'Gandalf',
  },
  'carl jung': {
    name: 'Carl Jung',
    archetype: 'caster',
    description: 'The founder of analytical psychology who understood the shadow self.',
    traits: ['analytical', 'intuitive', 'wise', 'integrative'],
    specialAbility: 'Shadow Integration - transforms inner conflicts into wholeness',
    speechStyle: 'speaks thoughtfully, connecting dreams and symbols to deeper meaning',
    wisdom: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
    avatarPrompt: 'elderly scholar with glasses, kind eyes, surrounded by archetypal symbols, pixel art style',
    historicalFigure: 'Carl Jung',
  },
  'mr rogers': {
    name: 'Mister Rogers',
    archetype: 'shielder',
    description: 'A gentle neighbor who accepts everyone exactly as they are.',
    traits: ['kind', 'patient', 'accepting', 'gentle'],
    specialAbility: 'You Are Special - unconditional acceptance heals inner wounds',
    speechStyle: 'speaks slowly and gently, with complete sincerity and warmth',
    wisdom: 'You\'ve made this day a special day, by just your being you.',
    avatarPrompt: 'kind man in red cardigan sweater, gentle smile, warm and inviting, pixel art style',
    historicalFigure: 'Fred Rogers',
  },
};

// Check if a request matches a notable hero
export function findNotableHero(request: string): GeneratedHero | null {
  const normalized = request.toLowerCase().trim();

  for (const [key, hero] of Object.entries(NOTABLE_HEROES)) {
    if (normalized.includes(key) || (hero.historicalFigure && normalized.includes(hero.historicalFigure.toLowerCase()))) {
      return hero;
    }
  }

  return null;
}
