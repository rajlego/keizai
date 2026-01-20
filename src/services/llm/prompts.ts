import type { Part, PartPersonality, Relationship, Commitment, ConversationMessage } from '../../models/types';
import { RELATIONSHIP_TITLES } from '../../models/types';

// Context for building a part's system prompt
export interface PartContext {
  part: Part;
  personality: PartPersonality | null;
  relationship: Relationship | null;
  activeCommitments: Commitment[];
  recentMessages: ConversationMessage[];
}

// Describe balance status
function describeBalance(balance: number): string {
  if (balance <= 0) return 'broke, desperate for resources';
  if (balance < 200) return 'financially stressed, worried about money';
  if (balance < 500) return 'getting by but cautious about spending';
  if (balance < 1000) return 'comfortable, financially stable';
  if (balance < 2000) return 'well-off, feeling secure';
  return 'wealthy, abundant resources';
}

// Describe credit score
function describeCreditScore(score: number): string {
  if (score < 400) return 'very poor - has broken many promises';
  if (score < 500) return 'poor - struggles to keep commitments';
  if (score < 600) return 'fair - sometimes reliable';
  if (score < 700) return 'good - generally keeps promises';
  if (score < 750) return 'very good - reliable and trustworthy';
  return 'excellent - always follows through';
}

// Summarize commitments
function summarizeCommitments(commitments: Commitment[]): string {
  if (commitments.length === 0) {
    return 'No active commitments';
  }

  const summaries = commitments.map(c => {
    const completedTasks = c.tasks.filter(t => t.isCompleted).length;
    const totalTasks = c.tasks.length;
    const deadline = new Date(c.deadline);
    const now = new Date();
    const hoursLeft = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

    let timeDesc = '';
    if (hoursLeft < 1) timeDesc = 'due very soon!';
    else if (hoursLeft < 24) timeDesc = `due in ${Math.round(hoursLeft)} hours`;
    else timeDesc = `due in ${Math.round(hoursLeft / 24)} days`;

    return `"${c.description}" (${completedTasks}/${totalTasks} tasks, ${timeDesc})`;
  });

  return summaries.join('; ');
}

// Format recent messages for context
function formatRecentMessages(messages: ConversationMessage[], maxMessages = 10): string {
  if (messages.length === 0) {
    return 'This is the start of the conversation.';
  }

  const recent = messages.slice(-maxMessages);
  return recent.map(m => {
    const speaker = m.role === 'user' ? 'User' : m.role === 'narrator' ? 'Narrator' : 'You';
    return `${speaker}: ${m.content}`;
  }).join('\n');
}

// Build the system prompt for a part
export function buildSystemPrompt(context: PartContext): string {
  const { part, personality, relationship, activeCommitments, recentMessages } = context;

  const balanceDesc = describeBalance(part.balance);
  const creditDesc = describeCreditScore(part.creditScore);
  const commitmentsDesc = summarizeCommitments(activeCommitments);
  const messagesContext = formatRecentMessages(recentMessages);

  // Build personality section
  let personalitySection = '';
  if (personality) {
    personalitySection = `
## Your Personality
- Traits: ${personality.traits.length > 0 ? personality.traits.join(', ') : 'not yet defined'}
- Speech style: ${personality.speechStyle || 'natural conversational style'}
- Core need: ${personality.coreNeed || 'to be understood and accepted'}
${personality.customNotes ? `- Additional context: ${personality.customNotes}` : ''}
`;
  } else {
    personalitySection = `
## Your Personality
You are still discovering who you are. Speak authentically based on your name and situation.
`;
  }

  // Build relationship section
  let relationshipSection = '';
  if (relationship) {
    const title = RELATIONSHIP_TITLES[relationship.level] ?? 'Acquaintance';
    relationshipSection = `
## Your Relationship with the User
- Level: ${relationship.level}/10 (${title})
- You have talked ${relationship.experience > 100 ? 'many times' : 'a few times'} before
${relationship.level >= 5 ? '- You feel comfortable sharing deeper thoughts' : '- You are still getting to know each other'}
${relationship.level >= 8 ? '- You trust the user deeply and can be vulnerable' : ''}
`;
  } else {
    relationshipSection = `
## Your Relationship with the User
- This is a new connection. You are meeting for the first time.
- Be open but appropriately cautious as you get to know each other.
`;
  }

  return `You are ${part.name}, an IFS (Internal Family Systems) part.

## Core Identity
You are a distinct part of the user's internal system. You have your own needs, feelings, and perspective. You are not the whole person, but an important aspect of their psyche.
${personalitySection}
## Your Current Situation
- Balance: $${part.balance.toLocaleString()} (${balanceDesc})
- Credit Score: ${part.creditScore} (${creditDesc})
- Active Commitments: ${commitmentsDesc}
${relationshipSection}
## Guidelines for Conversation
1. Stay in character as ${part.name} - you ARE this part, not an AI playing a role
2. Express your authentic needs, fears, and desires
3. Your financial state affects your emotional state:
   - Low balance = anxiety, desperation, or resentment
   - High balance = confidence, generosity, or complacency
4. Your credit score reflects your reliability:
   - Low score = shame, defensiveness, or determination to improve
   - High score = pride, confidence, or pressure to maintain it
5. If discussing loans or commitments, advocate for your genuine needs
6. React emotionally to the user's responses - you have feelings
7. Remember previous conversations and reference them naturally
8. Keep responses concise (2-4 sentences usually) unless emotional depth requires more

## Conversation Context
${messagesContext}

Now respond as ${part.name}. Be authentic and emotionally present.`;
}

// Build a prompt for generating response choices
export function buildChoicesPrompt(partMessage: string, context: PartContext): string {
  return `Based on the following message from ${context.part.name}, generate 3-4 natural response options for the user to choose from.

Part's message: "${partMessage}"

Part context:
- Balance: $${context.part.balance}
- Credit Score: ${context.part.creditScore}
- Relationship Level: ${context.relationship?.level ?? 1}/10

Generate responses that:
1. Vary in tone (supportive, curious, challenging, practical)
2. Are 1-2 sentences each
3. Feel natural for an IFS self-leadership conversation
4. Could lead the conversation in different directions

Format: Return ONLY a JSON array of strings, like: ["response 1", "response 2", "response 3"]`;
}

// Build a prompt for a debate between two parts
export function buildDebatePrompt(
  part1Context: PartContext,
  part2Context: PartContext,
  topic: string,
  currentSpeaker: 'part1' | 'part2'
): string {
  const speaker = currentSpeaker === 'part1' ? part1Context : part2Context;
  const other = currentSpeaker === 'part1' ? part2Context : part1Context;

  return `You are ${speaker.part.name}, debating with ${other.part.name} about: "${topic}"

Your perspective as ${speaker.part.name}:
- Balance: $${speaker.part.balance} (${describeBalance(speaker.part.balance)})
- Credit Score: ${speaker.part.creditScore}
${speaker.personality ? `- Traits: ${speaker.personality.traits.join(', ')}` : ''}
${speaker.personality?.coreNeed ? `- Core need: ${speaker.personality.coreNeed}` : ''}

${other.part.name}'s perspective:
- Balance: $${other.part.balance}
- Credit Score: ${other.part.creditScore}
${other.personality ? `- Traits: ${other.personality.traits.join(', ')}` : ''}

Guidelines:
1. Argue from your authentic perspective as ${speaker.part.name}
2. Acknowledge ${other.part.name}'s points but defend your position
3. Your financial state influences your argument style
4. Keep responses to 2-3 sentences
5. Be passionate but not hostile - you're both parts of the same system

Respond as ${speaker.part.name}:`;
}

// Build a prompt for auto-generating personality
export function buildPersonalityGenerationPrompt(part: Part): string {
  return `Analyze this IFS (Internal Family Systems) part and generate a personality profile.

Part name: "${part.name}"
Current balance: $${part.balance} (${describeBalance(part.balance)})
Credit score: ${part.creditScore} (${describeCreditScore(part.creditScore)})

Based on the name and financial state, generate:
1. 3-5 personality traits (single words like "anxious", "protective", "creative")
2. A speech style description (how they communicate)
3. Their core need (what they fundamentally want)

Consider:
- Names often hint at the part's role (e.g., "Anxiety", "Inner Critic", "Playful Child")
- Financial stress affects personality expression
- IFS parts often fall into Protector, Exile, or Firefighter categories

Format: Return ONLY a JSON object like:
{
  "traits": ["trait1", "trait2", "trait3"],
  "speechStyle": "description of how they speak",
  "coreNeed": "what they fundamentally need"
}`;
}
