import { create } from 'zustand';
import type { ConversationMessage } from '../models/types';

// Dialogue state for the active conversation
interface DialogueState {
  isOpen: boolean;
  partId: string | null;
  conversationId: string | null;
  isStreaming: boolean;
  streamingText: string;
  pendingChoices: string[];
  isGeneratingChoices: boolean;
}

// Debate state for part-to-part conversations
interface DebateState {
  isActive: boolean;
  participant1Id: string | null;
  participant2Id: string | null;
  currentSpeakerId: string | null;
  topic: string;
}

// Negotiation state for loan requests
interface NegotiationState {
  isActive: boolean;
  partId: string | null;
  requestedAmount: number;
  proposedTerms: string;
  counterOffers: number;
}

interface GameStoreState {
  // Dialogue
  dialogue: DialogueState;
  openDialogue: (partId: string, conversationId?: string) => void;
  closeDialogue: () => void;
  setStreaming: (isStreaming: boolean, text?: string) => void;
  appendStreamingText: (text: string) => void;
  setChoices: (choices: string[]) => void;
  setGeneratingChoices: (isGenerating: boolean) => void;

  // Debate
  debate: DebateState;
  startDebate: (part1Id: string, part2Id: string, topic: string) => void;
  setDebateSpeaker: (partId: string) => void;
  endDebate: () => void;

  // Negotiation
  negotiation: NegotiationState;
  startNegotiation: (partId: string, amount: number, terms: string) => void;
  updateNegotiationTerms: (terms: string) => void;
  incrementCounterOffer: () => void;
  endNegotiation: () => void;

  // Part hover/selection in game view
  hoveredPartId: string | null;
  selectedPartId: string | null;
  setHoveredPart: (partId: string | null) => void;
  setSelectedPart: (partId: string | null) => void;

  // Player movement
  isPlayerMoving: boolean;
  playerTargetPosition: { x: number; y: number } | null;
  setPlayerMoving: (isMoving: boolean, target?: { x: number; y: number }) => void;

  // Message history for current session (not persisted)
  sessionMessages: ConversationMessage[];
  addSessionMessage: (message: ConversationMessage) => void;
  clearSessionMessages: () => void;
}

const initialDialogueState: DialogueState = {
  isOpen: false,
  partId: null,
  conversationId: null,
  isStreaming: false,
  streamingText: '',
  pendingChoices: [],
  isGeneratingChoices: false,
};

const initialDebateState: DebateState = {
  isActive: false,
  participant1Id: null,
  participant2Id: null,
  currentSpeakerId: null,
  topic: '',
};

const initialNegotiationState: NegotiationState = {
  isActive: false,
  partId: null,
  requestedAmount: 0,
  proposedTerms: '',
  counterOffers: 0,
};

export const useGameStore = create<GameStoreState>((set) => ({
  // Dialogue
  dialogue: initialDialogueState,

  openDialogue: (partId, conversationId) => set({
    dialogue: {
      ...initialDialogueState,
      isOpen: true,
      partId,
      conversationId: conversationId ?? null,
    },
  }),

  closeDialogue: () => set({
    dialogue: initialDialogueState,
  }),

  setStreaming: (isStreaming, text = '') => set((state) => ({
    dialogue: {
      ...state.dialogue,
      isStreaming,
      streamingText: text,
    },
  })),

  appendStreamingText: (text) => set((state) => ({
    dialogue: {
      ...state.dialogue,
      streamingText: state.dialogue.streamingText + text,
    },
  })),

  setChoices: (choices) => set((state) => ({
    dialogue: {
      ...state.dialogue,
      pendingChoices: choices,
      isGeneratingChoices: false,
    },
  })),

  setGeneratingChoices: (isGenerating) => set((state) => ({
    dialogue: {
      ...state.dialogue,
      isGeneratingChoices: isGenerating,
      pendingChoices: isGenerating ? [] : state.dialogue.pendingChoices,
    },
  })),

  // Debate
  debate: initialDebateState,

  startDebate: (part1Id, part2Id, topic) => set({
    debate: {
      isActive: true,
      participant1Id: part1Id,
      participant2Id: part2Id,
      currentSpeakerId: part1Id,
      topic,
    },
  }),

  setDebateSpeaker: (partId) => set((state) => ({
    debate: {
      ...state.debate,
      currentSpeakerId: partId,
    },
  })),

  endDebate: () => set({
    debate: initialDebateState,
  }),

  // Negotiation
  negotiation: initialNegotiationState,

  startNegotiation: (partId, amount, terms) => set({
    negotiation: {
      isActive: true,
      partId,
      requestedAmount: amount,
      proposedTerms: terms,
      counterOffers: 0,
    },
  }),

  updateNegotiationTerms: (terms) => set((state) => ({
    negotiation: {
      ...state.negotiation,
      proposedTerms: terms,
    },
  })),

  incrementCounterOffer: () => set((state) => ({
    negotiation: {
      ...state.negotiation,
      counterOffers: state.negotiation.counterOffers + 1,
    },
  })),

  endNegotiation: () => set({
    negotiation: initialNegotiationState,
  }),

  // Part hover/selection
  hoveredPartId: null,
  selectedPartId: null,

  setHoveredPart: (partId) => set({ hoveredPartId: partId }),
  setSelectedPart: (partId) => set({ selectedPartId: partId }),

  // Player movement
  isPlayerMoving: false,
  playerTargetPosition: null,

  setPlayerMoving: (isMoving, target) => set({
    isPlayerMoving: isMoving,
    playerTargetPosition: target ?? null,
  }),

  // Session messages
  sessionMessages: [],

  addSessionMessage: (message) => set((state) => ({
    sessionMessages: [...state.sessionMessages, message],
  })),

  clearSessionMessages: () => set({ sessionMessages: [] }),
}));
