import { useState, useCallback } from 'react';
import type { Part, PartPersonality, BattleCharacter, HeroArchetype } from '../../models/types';
import { ScenarioInput } from './setup/ScenarioInput';
import { VillainReveal } from './setup/VillainReveal';
import { HeroSelection } from './setup/HeroSelection';
import { ArenaView } from './arena/ArenaView';
import {
  generateVillain,
  analyzeScenario,
  toVillainCharacter,
  generateHero,
  toHeroCharacter,
  createArchetypeHero,
  findNotableHero,
} from '../../services/battle';
import { useBattleActions, useActiveBattle } from '../../hooks/useBattle';
import { generateAvatar } from '../../services/avatar';

type BattlePhase = 'scenario' | 'villain-reveal' | 'hero-selection' | 'combat';

interface BattleViewProps {
  parts: Array<{ part: Part; personality: PartPersonality | null }>;
  apiKey: string;
  falApiKey?: string;
  onClose: () => void;
}

export function BattleView({
  parts,
  apiKey,
  falApiKey,
  onClose,
}: BattleViewProps) {
  const [phase, setPhase] = useState<BattlePhase>('scenario');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioAnalysis, setScenarioAnalysis] = useState<string>();
  const [generatedVillain, setGeneratedVillain] = useState<BattleCharacter | null>(null);
  const [selectedHeroes, setSelectedHeroes] = useState<BattleCharacter[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [scenario, setScenario] = useState('');

  const { createBattle, summonHero, setBattleStatus, startBattle, fleeBattle, removeBattle } = useBattleActions();
  const activeBattle = useActiveBattle();

  // Generate unique ID
  const generateId = (prefix: string): string => {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  };

  // Phase 1: Handle scenario submission
  const handleScenarioSubmit = useCallback(async (scenarioText: string, partIds: string[]) => {
    setIsLoading(true);
    setScenario(scenarioText);
    setSelectedPartIds(partIds);

    try {
      // Analyze scenario
      const analysis = await analyzeScenario(scenarioText, apiKey);
      setScenarioAnalysis(analysis);

      // Generate villain
      const selectedParts = parts.filter(p => partIds.includes(p.part.id));
      const villainData = await generateVillain({
        scenario: scenarioText,
        parts: selectedParts,
      }, apiKey);

      // Create villain character
      const villainChar: BattleCharacter = {
        ...toVillainCharacter(villainData),
        id: generateId('vln'),
        createdAt: new Date().toISOString(),
      };

      // Generate villain avatar if fal API key is available
      if (falApiKey && villainData.avatarPrompt) {
        try {
          const avatarResult = await generateAvatar(villainData.avatarPrompt, falApiKey);
          if (avatarResult.success && avatarResult.url) {
            villainChar.avatarUrl = avatarResult.url;
          }
        } catch (error) {
          console.error('[Battle] Avatar generation failed:', error);
        }
      }

      setGeneratedVillain(villainChar);
      setPhase('villain-reveal');
    } catch (error) {
      console.error('[Battle] Scenario processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, falApiKey, parts]);

  // Phase 2: Handle villain regeneration
  const handleRegenerateVillain = useCallback(async () => {
    if (!scenario) return;
    setIsLoading(true);

    try {
      const selectedParts = parts.filter(p => selectedPartIds.includes(p.part.id));
      const villainData = await generateVillain({
        scenario,
        parts: selectedParts,
      }, apiKey);

      const villainChar: BattleCharacter = {
        ...toVillainCharacter(villainData),
        id: generateId('vln'),
        createdAt: new Date().toISOString(),
      };

      if (falApiKey && villainData.avatarPrompt) {
        try {
          const avatarResult = await generateAvatar(villainData.avatarPrompt, falApiKey);
          if (avatarResult.success && avatarResult.url) {
            villainChar.avatarUrl = avatarResult.url;
          }
        } catch (error) {
          console.error('[Battle] Avatar generation failed:', error);
        }
      }

      setGeneratedVillain(villainChar);
    } catch (error) {
      console.error('[Battle] Villain regeneration failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scenario, selectedPartIds, parts, apiKey, falApiKey]);

  // Phase 2: Continue to hero selection
  const handleVillainContinue = useCallback(() => {
    if (!generatedVillain) return;

    // Create the battle with the villain
    const battleId = createBattle(scenario, {
      name: generatedVillain.name,
      role: 'villain',
      health: generatedVillain.health,
      maxHealth: generatedVillain.maxHealth,
      understanding: 0,
      trust: 0,
      description: generatedVillain.description,
      traits: generatedVillain.traits,
      coreNeed: generatedVillain.coreNeed,
      speechStyle: generatedVillain.speechStyle,
      avatarUrl: generatedVillain.avatarUrl,
      avatarPrompt: generatedVillain.avatarPrompt,
    }, selectedPartIds);

    setBattleStatus(battleId, 'summoning');
    setPhase('hero-selection');
  }, [generatedVillain, scenario, selectedPartIds, createBattle, setBattleStatus]);

  // Phase 3: Select an archetype hero
  const handleSelectArchetype = useCallback(async (archetype: HeroArchetype) => {
    if (!activeBattle) return;
    setIsLoading(true);

    try {
      const heroData = createArchetypeHero(archetype);
      const heroChar: BattleCharacter = {
        ...heroData,
        id: generateId('hero'),
        createdAt: new Date().toISOString(),
      };

      // Generate avatar
      if (falApiKey && heroData.avatarPrompt) {
        try {
          const avatarResult = await generateAvatar(heroData.avatarPrompt, falApiKey);
          if (avatarResult.success && avatarResult.url) {
            heroChar.avatarUrl = avatarResult.url;
          }
        } catch (error) {
          console.error('[Battle] Hero avatar generation failed:', error);
        }
      }

      summonHero(activeBattle.id, heroChar);
      setSelectedHeroes(prev => [...prev, heroChar]);
    } catch (error) {
      console.error('[Battle] Hero selection failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBattle, falApiKey, summonHero]);

  // Phase 3: Summon a custom hero
  const handleSummonCustom = useCallback(async (request: string) => {
    if (!activeBattle || !generatedVillain) return;
    setIsLoading(true);

    try {
      // Check for notable heroes first
      const notable = findNotableHero(request);
      let heroData;

      if (notable) {
        heroData = toHeroCharacter(notable);
      } else {
        // Generate custom hero
        const generated = await generateHero({
          scenario,
          villainName: generatedVillain.name,
          villainDescription: generatedVillain.description,
          request,
          existingHeroes: selectedHeroes,
        }, apiKey);
        heroData = toHeroCharacter(generated);
      }

      const heroChar: BattleCharacter = {
        ...heroData,
        id: generateId('hero'),
        createdAt: new Date().toISOString(),
      };

      // Generate avatar
      if (falApiKey && heroData.avatarPrompt) {
        try {
          const avatarResult = await generateAvatar(heroData.avatarPrompt, falApiKey);
          if (avatarResult.success && avatarResult.url) {
            heroChar.avatarUrl = avatarResult.url;
          }
        } catch (error) {
          console.error('[Battle] Hero avatar generation failed:', error);
        }
      }

      summonHero(activeBattle.id, heroChar);
      setSelectedHeroes(prev => [...prev, heroChar]);
    } catch (error) {
      console.error('[Battle] Custom hero summoning failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBattle, generatedVillain, scenario, selectedHeroes, apiKey, falApiKey, summonHero]);

  // Phase 3: Remove a hero
  const handleRemoveHero = useCallback((heroId: string) => {
    setSelectedHeroes(prev => prev.filter(h => h.id !== heroId));
    // Note: We don't remove from battle here since the battle hook handles that
  }, []);

  // Phase 3: Start the battle
  const handleStartBattle = useCallback(() => {
    if (!activeBattle) return;
    startBattle(activeBattle.id);
    setPhase('combat');
  }, [activeBattle, startBattle]);

  // Phase 3: Go back to villain reveal
  const handleBackToVillain = useCallback(() => {
    // Remove the current battle
    if (activeBattle) {
      removeBattle(activeBattle.id);
    }
    setSelectedHeroes([]);
    setPhase('villain-reveal');
  }, [activeBattle, removeBattle]);

  // Combat: Handle battle end
  const handleBattleEnd = useCallback(() => {
    onClose();
  }, [onClose]);

  // Combat: Handle flee
  const handleFlee = useCallback(() => {
    if (activeBattle) {
      fleeBattle(activeBattle.id);
    }
    onClose();
  }, [activeBattle, fleeBattle, onClose]);

  // Handle cancel at any phase
  const handleCancel = useCallback(() => {
    if (activeBattle) {
      removeBattle(activeBattle.id);
    }
    onClose();
  }, [activeBattle, removeBattle, onClose]);

  // Render based on current phase
  return (
    <div className="h-full overflow-auto">
      {phase === 'scenario' && (
        <div className="p-4">
          <ScenarioInput
            parts={parts}
            onSubmit={handleScenarioSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {phase === 'villain-reveal' && generatedVillain && (
        <div className="p-4">
          <VillainReveal
            villain={generatedVillain}
            scenarioAnalysis={scenarioAnalysis}
            onContinue={handleVillainContinue}
            onRegenerate={handleRegenerateVillain}
            onCancel={handleCancel}
            isGeneratingAvatar={isLoading}
          />
        </div>
      )}

      {phase === 'hero-selection' && generatedVillain && (
        <div className="p-4">
          <HeroSelection
            villain={generatedVillain}
            selectedHeroes={selectedHeroes}
            onSelectArchetype={handleSelectArchetype}
            onSummonCustom={handleSummonCustom}
            onRemoveHero={handleRemoveHero}
            onStartBattle={handleStartBattle}
            onBack={handleBackToVillain}
            isLoading={isLoading}
          />
        </div>
      )}

      {phase === 'combat' && activeBattle && (
        <ArenaView
          battle={activeBattle}
          apiKey={apiKey}
          onBattleEnd={handleBattleEnd}
          onFlee={handleFlee}
        />
      )}
    </div>
  );
}
