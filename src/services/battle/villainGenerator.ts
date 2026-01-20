import OpenAI from 'openai';
import type { Part, PartPersonality, BattleCharacter } from '../../models/types';

// OpenRouter API base URL
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

interface VillainGenerationInput {
  scenario: string;
  parts: Array<{
    part: Part;
    personality: PartPersonality | null;
  }>;
}

interface GeneratedVillain {
  name: string;
  description: string;
  coreNeed: string;
  traits: string[];
  speechStyle: string;
  maxHealth: number;
  avatarPrompt: string;
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

// Build the villain generation prompt
function buildVillainPrompt(input: VillainGenerationInput): string {
  const partsDescription = input.parts.map(({ part, personality }) => {
    if (personality) {
      return `- ${part.name}: ${personality.traits.join(', ')}. ${personality.coreNeed}`;
    }
    return `- ${part.name}`;
  }).join('\n');

  return `You are an IFS (Internal Family Systems) therapist creating a therapeutic "boss battle" villain.

The user is facing this challenge:
"${input.scenario}"

The user's IFS parts that will help in this battle:
${partsDescription}

Create a "Villain" that represents the core internal conflict. This villain should:
1. Have understandable motivations - it's a protector that has become extreme
2. Represent the REAL internal struggle described in the scenario
3. Be defeatable through understanding (empathy), negotiation (boundaries), OR direct confrontation (willpower)
4. Have a hidden core need that, when acknowledged, leads to integration

The villain is NOT evil - it's a part of the psyche trying to protect in a misguided way.

Return ONLY a JSON object in this exact format:
{
  "name": "dramatic villain name (e.g., 'The Perfectionist Tyrant', 'The Anxiety Sentinel')",
  "description": "what this villain represents internally (2-3 sentences)",
  "coreNeed": "the underlying need driving this behavior (1 sentence)",
  "traits": ["trait1", "trait2", "trait3"],
  "speechStyle": "how they speak (e.g., 'cold and demanding', 'frantic and worried')",
  "maxHealth": 100,
  "avatarPrompt": "visual description for pixel art generation, dramatic and imposing but not evil"
}`;
}

// Analyze a scenario to provide context
export async function analyzeScenario(
  scenario: string,
  apiKey: string
): Promise<string> {
  const client = createClient(apiKey);

  const prompt = `Briefly analyze this IFS (Internal Family Systems) scenario in 2-3 sentences:
"${scenario}"

Identify:
1. The core emotional conflict
2. What protective parts might be involved
3. What the underlying fear or need might be

Be concise and therapeutic in tone.`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content ?? 'This scenario involves internal conflict that can be explored through dialogue.';
  } catch (error) {
    console.error('[Battle] Scenario analysis error:', error);
    return 'This scenario involves internal conflict that can be explored through dialogue.';
  }
}

// Generate a villain from a scenario
export async function generateVillain(
  input: VillainGenerationInput,
  apiKey: string
): Promise<GeneratedVillain> {
  const client = createClient(apiKey);
  const prompt = buildVillainPrompt(input);

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
        name: parsed.name ?? 'The Inner Adversary',
        description: parsed.description ?? 'A manifestation of internal conflict.',
        coreNeed: parsed.coreNeed ?? 'To feel safe and in control.',
        traits: parsed.traits ?? ['protective', 'intense', 'misguided'],
        speechStyle: parsed.speechStyle ?? 'speaks with intensity and conviction',
        maxHealth: parsed.maxHealth ?? 100,
        avatarPrompt: parsed.avatarPrompt ?? 'dark shadowy figure with glowing eyes, imposing but not evil, pixel art style',
      };
    }

    // Fallback
    return getDefaultVillain(input.scenario);
  } catch (error) {
    console.error('[Battle] Villain generation error:', error);
    return getDefaultVillain(input.scenario);
  }
}

// Default villain if generation fails
function getDefaultVillain(scenario: string): GeneratedVillain {
  // Try to identify keywords for a more relevant default
  const lowerScenario = scenario.toLowerCase();

  if (lowerScenario.includes('perfect') || lowerScenario.includes('enough')) {
    return {
      name: 'The Perfectionist',
      description: 'A relentless inner critic that demands flawless performance, believing mistakes are unforgivable.',
      coreNeed: 'To protect you from criticism and rejection by making sure everything is perfect.',
      traits: ['demanding', 'critical', 'unrelenting'],
      speechStyle: 'speaks in cold, precise tones, always pointing out flaws',
      maxHealth: 100,
      avatarPrompt: 'stern figure in dark armor with clipboard and glowing red pen, imposing judge, pixel art style',
    };
  }

  if (lowerScenario.includes('anxious') || lowerScenario.includes('worry') || lowerScenario.includes('fear')) {
    return {
      name: 'The Anxiety Sentinel',
      description: 'An ever-watchful guardian that sees danger everywhere, keeping you paralyzed with what-ifs.',
      coreNeed: 'To keep you safe by anticipating every possible threat.',
      traits: ['vigilant', 'catastrophizing', 'protective'],
      speechStyle: 'speaks rapidly, always warning of potential dangers',
      maxHealth: 100,
      avatarPrompt: 'hooded figure with many eyes, surrounded by swirling mist of worries, pixel art style',
    };
  }

  if (lowerScenario.includes('procrastin') || lowerScenario.includes('lazy') || lowerScenario.includes('stuck')) {
    return {
      name: 'The Comfortable Keeper',
      description: 'A protector that keeps you in familiar patterns, afraid of the uncertainty that comes with change.',
      coreNeed: 'To protect you from failure and discomfort by avoiding all risk.',
      traits: ['avoidant', 'comfortable', 'risk-averse'],
      speechStyle: 'speaks softly and persuasively, always offering reasons to wait',
      maxHealth: 100,
      avatarPrompt: 'large comfortable figure wrapped in blankets, gentle but immovable, pixel art style',
    };
  }

  // Generic default
  return {
    name: 'The Inner Adversary',
    description: 'A protective part that has grown too powerful, blocking your growth with misguided intentions.',
    coreNeed: 'To protect you from pain, even if it means limiting your potential.',
    traits: ['protective', 'stubborn', 'misguided'],
    speechStyle: 'speaks with conviction, certain they know what is best',
    maxHealth: 100,
    avatarPrompt: 'shadowy figure with glowing eyes, defensive posture, imposing but not evil, pixel art style',
  };
}

// Convert generated villain to BattleCharacter (partial - needs id and createdAt)
export function toVillainCharacter(generated: GeneratedVillain): Omit<BattleCharacter, 'id' | 'createdAt'> {
  return {
    name: generated.name,
    role: 'villain',
    health: generated.maxHealth,
    maxHealth: generated.maxHealth,
    understanding: 0,
    trust: 0,
    description: generated.description,
    traits: generated.traits,
    coreNeed: generated.coreNeed,
    speechStyle: generated.speechStyle,
    avatarPrompt: generated.avatarPrompt,
  };
}
