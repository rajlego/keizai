import { useState, useEffect, useMemo } from 'react';
import { getAllTransactions, onTransactionsChange } from '../sync/yjsProvider';
import type { Transaction } from '../models/types';

export function useTransactions(): Transaction[] {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getAllTransactions());
    return onTransactionsChange(setTransactions);
  }, []);

  return transactions;
}

export function usePartTransactions(partId: string): Transaction[] {
  const transactions = useTransactions();

  return useMemo(() => {
    return transactions.filter(
      (tx) => tx.fromId === partId || tx.toId === partId
    );
  }, [transactions, partId]);
}
