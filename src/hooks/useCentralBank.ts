import { useState, useEffect } from 'react';
import {
  getCentralBank,
  onCentralBankChange,
  updateCentralBank,
} from '../sync/yjsProvider';
import { useSettingsStore } from '../store/settingsStore';
import type { CentralBank } from '../models/types';

export function useCentralBank(): CentralBank {
  const [centralBank, setCentralBank] = useState<CentralBank>(getCentralBank());
  const centralBankRegenRate = useSettingsStore((s) => s.centralBankRegenRate);

  useEffect(() => {
    setCentralBank(getCentralBank());
    return onCentralBankChange(setCentralBank);
  }, []);

  // Check for regeneration on mount
  useEffect(() => {
    checkAndApplyRegeneration(centralBankRegenRate);
  }, [centralBankRegenRate]);

  return centralBank;
}

// Regeneration check - adds credits to central bank over time
function checkAndApplyRegeneration(regenRate: number): void {
  const bank = getCentralBank();
  const lastRegen = new Date(bank.lastRegenAt);
  const now = new Date();

  // Calculate hours since last regeneration
  const hoursSinceRegen = Math.floor(
    (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60)
  );

  if (hoursSinceRegen >= 1) {
    const regenAmount = hoursSinceRegen * regenRate;

    updateCentralBank({
      balance: bank.balance + regenAmount,
      totalMoneySupply: bank.totalMoneySupply + regenAmount,
      lastRegenAt: now.toISOString(),
    });

    console.log(
      `[CentralBank] Regenerated ${regenAmount} credits (${hoursSinceRegen}h * ${regenRate}/h)`
    );
  }
}
