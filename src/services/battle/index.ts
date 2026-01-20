import OpenAI from 'openai';
import type {
  Battle,
  BattleCharacter,
  BattleAction,
  BattleActionType,
  VictoryType,
  BattleReward,
  Part,
  PartPersonality,
} from '../../models/types';
import { HERO_ARCHETYPES } from '../../models/types';

// Re-export generators
export { generateVillain, analyzeScenario, toVillainCharacter } from './villainGenerator';
export { generateHero, createArchetypeHero, toHeroCharacter, findNotableHero, NOTABLE_HEROES } from './heroGenerator';

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
      'X-Title': 'Keizai IFS Battle',
    },
  });
}

// ============================================
// ACTION RESOLUTION
// ============================================

interface ActionResult {
  actionType: BattleActionType;
  targetId: string;
  dialogue: string;
  narration: string;
  damage?: number;
  healing?: number;
  trustDelta?: number;
  understandingDelta?: number;
}

// Calculate base effects for an action type
function getBaseEffects(actionType: BattleActionType): {
  damage?: number;
  healing?: number;
  trustDelta?: number;
  understandingDelta?: number;
} {
  switch (actionType) {
    case 'attack':
      return { damage: 15 + Math.floor(Math.random() * 10) }; // 15-24 damage
    case 'understand':
      return { understandingDelta: 10 + Math.floor(Math.random() * 10) }; // 10-19 understanding
    case 'negotiate':
      return { trustDelta: 10 + Math.floor(Math.random() * 10) }; // 10-19 trust
    case 'support':
      return { healing: 15 + Math.floor(Math.random() * 10) }; // 15-24 healing
    case 'defend':
      return {}; // Defend is handled differently (reduces incoming damage)
    case 'special':
      return { damage: 20, understandingDelta: 15, trustDelta: 10 }; // Balanced special
    default:
      return {};
  }
}

// Generate AI action for a character
export async function generateAIAction(
  battle: Battle,
  characterId: string,
  apiKey: string
): Promise<ActionResult> {
  const client = createClient(apiKey);

  // Find the character
  let character: BattleCharacter | undefined;
  if (battle.villain.id === characterId) {
    character = battle.villain;
  } else {
    character = battle.heroes.find(h => h.id === characterId);
  }

  if (!character) {
    throw new Error('Character not found');
  }

  const isVillain = character.role === 'villain';
  const archetypeDef = character.archetype ? HERO_ARCHETYPES[character.archetype] : null;

  // Build context for the AI
  const recentActions = battle.actions.slice(-5).map(a => {
    const actor = battle.villain.id === a.characterId
      ? battle.villain
      : battle.heroes.find(h => h.id === a.characterId);
    return `${actor?.name ?? 'Unknown'}: ${a.dialogue} (${a.actionType})`;
  }).join('\n');

  const prompt = `You are ${character.name} in an IFS therapeutic battle.
Role: ${character.role}
Traits: ${character.traits.join(', ')}
Core need: ${character.coreNeed}
Speech style: ${character.speechStyle}
${archetypeDef ? `Special ability: ${archetypeDef.specialAbility}` : ''}

Current battle state:
- Villain "${battle.villain.name}" HP: ${battle.villain.health}/${battle.villain.maxHealth}
- Villain understanding: ${battle.villain.understanding}%
- Villain trust: ${battle.villain.trust}%
- Round: ${battle.currentRound}

Recent events:
${recentActions || 'Battle just started'}

${isVillain
    ? `As the villain, you are a protective part that has become extreme. You can:
- ATTACK: Lash out, criticize, or overwhelm
- DEFEND: Retreat into defensive patterns
- Show vulnerability when understanding/trust is high (you secretly want to be understood)`
    : `As a hero, choose your action wisely:
- ATTACK: Direct confrontation (damages villain HP)
- UNDERSTAND: Explore the villain's pain/need (+understanding)
- NEGOTIATE: Seek common ground, set boundaries (+trust)
- SUPPORT: Help an ally (heal)
- DEFEND: Protect yourself or ally
- SPECIAL: Use your unique ability`
}

Return ONLY a JSON object:
{
  "actionType": "${isVillain ? 'attack or defend' : 'attack|understand|negotiate|support|defend|special'}",
  "targetId": "${isVillain ? 'a hero id' : battle.villain.id}",
  "dialogue": "what you say in character (1-2 sentences, match your speech style)",
  "narration": "brief action description (1 sentence)"
}`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const actionType = isValidActionType(parsed.actionType) ? parsed.actionType : 'attack';
      const effects = getBaseEffects(actionType);

      return {
        actionType,
        targetId: parsed.targetId ?? battle.villain.id,
        dialogue: parsed.dialogue ?? 'Let me help.',
        narration: parsed.narration ?? 'They take action.',
        ...effects,
      };
    }
  } catch (error) {
    console.error('[Battle] AI action generation error:', error);
  }

  // Fallback
  return {
    actionType: isVillain ? 'attack' : 'understand',
    targetId: isVillain ? (battle.heroes[0]?.id ?? '') : battle.villain.id,
    dialogue: isVillain ? 'You cannot defeat me!' : 'I want to understand.',
    narration: isVillain ? 'The villain strikes out.' : 'They reach out with empathy.',
    ...getBaseEffects(isVillain ? 'attack' : 'understand'),
  };
}

function isValidActionType(value: string): value is BattleActionType {
  return ['attack', 'defend', 'support', 'negotiate', 'understand', 'special'].includes(value);
}

// ============================================
// VILLAIN RESPONSE
// ============================================

// Generate villain's response to a player action
export async function generateVillainResponse(
  battle: Battle,
  playerAction: BattleAction,
  apiKey: string
): Promise<ActionResult> {
  const client = createClient(apiKey);
  const villain = battle.villain;

  // Villain's state affects response
  const isWeakened = villain.health < villain.maxHealth * 0.3;
  const isUnderstood = villain.understanding > 50;
  const isTrusting = villain.trust > 50;

  const prompt = `You are ${villain.name}, a villain in an IFS therapeutic battle.
Description: ${villain.description}
Core need (hidden): ${villain.coreNeed}
Speech style: ${villain.speechStyle}

Current state:
- HP: ${villain.health}/${villain.maxHealth} ${isWeakened ? '(WEAKENED)' : ''}
- Understanding: ${villain.understanding}% ${isUnderstood ? '(starting to feel understood)' : ''}
- Trust: ${villain.trust}% ${isTrusting ? '(starting to trust)' : ''}

The player just did: ${playerAction.actionType}
They said: "${playerAction.dialogue}"
What happened: ${playerAction.narration}

${isUnderstood || isTrusting
    ? 'You are beginning to soften. Your responses should show vulnerability beneath the aggression.'
    : isWeakened
      ? 'You are weakened but still defiant. Show cracks in your armor.'
      : 'You are still in your protective, antagonistic mode.'}

Respond as the villain. Return ONLY a JSON object:
{
  "actionType": "attack or defend",
  "dialogue": "what you say (1-2 sentences, match speech style, show appropriate vulnerability based on state)",
  "narration": "brief action description"
}`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const actionType = parsed.actionType === 'defend' ? 'defend' : 'attack';
      const effects = getBaseEffects(actionType);

      // Reduce damage if villain is softening
      if (effects.damage && (isUnderstood || isTrusting)) {
        effects.damage = Math.floor(effects.damage * 0.7);
      }

      return {
        actionType,
        targetId: playerAction.characterId,
        dialogue: parsed.dialogue ?? 'You cannot change me!',
        narration: parsed.narration ?? 'The villain responds.',
        ...effects,
      };
    }
  } catch (error) {
    console.error('[Battle] Villain response error:', error);
  }

  // Fallback
  return {
    actionType: 'attack',
    targetId: playerAction.characterId,
    dialogue: 'You cannot defeat what you refuse to understand!',
    narration: 'The villain lashes out defensively.',
    damage: isUnderstood || isTrusting ? 10 : 15,
  };
}

// ============================================
// VICTORY CHECKING
// ============================================

export function checkVictoryCondition(battle: Battle): VictoryType | null {
  const villain = battle.villain;

  // HP Depletion - villain health reaches 0
  if (villain.health <= 0) {
    return 'hp_depletion';
  }

  // Integration - understanding reaches 100
  if (villain.understanding >= 100) {
    return 'integration';
  }

  // Negotiation - trust reaches 100
  if (villain.trust >= 100) {
    return 'negotiation';
  }

  // Defeat - all heroes have 0 health
  const aliveHeroes = battle.heroes.filter(h => h.health > 0);
  if (aliveHeroes.length === 0 && battle.heroes.length > 0) {
    return 'defeat';
  }

  return null;
}

// ============================================
// REWARDS
// ============================================

export function calculateRewards(
  battle: Battle,
  victoryType: VictoryType,
  parts: Part[]
): BattleReward[] {
  const rewards: BattleReward[] = [];

  // Base XP for participating parts
  const baseXP = victoryType === 'defeat' || victoryType === 'flee' ? 10 : 50;

  // Bonus for non-violent victories
  const victoryBonus =
    victoryType === 'integration' ? 50 :
      victoryType === 'negotiation' ? 40 :
        victoryType === 'hp_depletion' ? 20 : 0;

  // XP rewards for parts
  for (const partId of battle.partIds) {
    const part = parts.find(p => p.id === partId);
    if (part) {
      rewards.push({
        type: 'xp',
        partId,
        amount: baseXP + victoryBonus,
        description: `${part.name} gained ${baseXP + victoryBonus} relationship XP`,
      });
    }
  }

  // Currency reward
  if (victoryType !== 'defeat' && victoryType !== 'flee') {
    const currencyReward = victoryType === 'integration' ? 200 : victoryType === 'negotiation' ? 150 : 100;
    rewards.push({
      type: 'currency',
      amount: currencyReward,
      description: `Earned $${currencyReward} for resolving the conflict`,
    });
  }

  // Insight reward for integration
  if (victoryType === 'integration') {
    rewards.push({
      type: 'insight',
      description: `Insight: The villain "${battle.villain.name}" needed ${battle.villain.coreNeed}`,
    });
  }

  // Ability unlock for negotiation
  if (victoryType === 'negotiation') {
    rewards.push({
      type: 'ability',
      description: `New ability: "Boundary Setting" - ${battle.villain.name} now respects agreed boundaries`,
    });
  }

  return rewards;
}

// ============================================
// VICTORY NARRATIVES
// ============================================

export async function generateVictoryNarrative(
  battle: Battle,
  victoryType: VictoryType,
  apiKey: string
): Promise<string> {
  const client = createClient(apiKey);

  const victoryContext = {
    hp_depletion: 'The villain was defeated through direct confrontation. The inner conflict has been overcome through willpower.',
    integration: 'The villain was understood and integrated. Their protective purpose was acknowledged and transformed.',
    negotiation: 'An agreement was reached with the villain. Healthy boundaries have been established.',
    defeat: 'The heroes fell. But this is not the end - growth comes from trying again.',
    flee: 'The battle was abandoned for now. Sometimes retreat is wisdom.',
  };

  const prompt = `Write a brief (2-3 sentences) therapeutic narrative for the end of an IFS battle.

Villain: ${battle.villain.name} - ${battle.villain.description}
Core need: ${battle.villain.coreNeed}
Victory type: ${victoryType}
Context: ${victoryContext[victoryType]}

Write in second person ("You..."). Be warm, therapeutic, and affirming. Focus on growth and integration.`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content ?? getFallbackNarrative(victoryType, battle.villain.name);
  } catch (error) {
    console.error('[Battle] Victory narrative error:', error);
    return getFallbackNarrative(victoryType, battle.villain.name);
  }
}

function getFallbackNarrative(victoryType: VictoryType, villainName: string): string {
  switch (victoryType) {
    case 'integration':
      return `You reached out with understanding, and ${villainName} finally felt seen. What once seemed like an enemy was a protector all along, now integrated into your inner family.`;
    case 'negotiation':
      return `Through patient dialogue, you and ${villainName} found common ground. A boundary has been set, and both sides can now coexist in peace.`;
    case 'hp_depletion':
      return `Through determination and support from your allies, ${villainName}'s grip has loosened. The pattern is broken, creating space for new growth.`;
    case 'defeat':
      return `This battle was lost, but not the war. Every attempt brings you closer to understanding. Rest, recover, and try again.`;
    case 'flee':
      return `Sometimes the wisest choice is to step back. You can return to face ${villainName} when you're ready.`;
    default:
      return `The battle has ended. Whatever the outcome, you've taken a brave step in facing your inner world.`;
  }
}

// ============================================
// PART AS BATTLE CHARACTER
// ============================================

// Convert a user's Part to a battle character
export function partToBattleCharacter(
  part: Part,
  personality: PartPersonality | null
): Omit<BattleCharacter, 'id' | 'createdAt'> {
  return {
    name: part.name,
    role: 'part',
    health: 50,
    maxHealth: 50,
    understanding: 0,
    trust: 0,
    description: personality?.customNotes ?? `${part.name} is ready to help.`,
    traits: personality?.traits ?? ['supportive'],
    coreNeed: personality?.coreNeed ?? 'to be helpful',
    speechStyle: personality?.speechStyle ?? 'speaks supportively',
    partId: part.id,
    avatarUrl: part.avatarUrl,
    avatarPrompt: part.avatarPrompt,
  };
}
