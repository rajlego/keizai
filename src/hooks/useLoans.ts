import { useState, useEffect, useMemo } from 'react';
import { getAllCommitments, onCommitmentsChange } from '../sync/yjsProvider';
import type { Commitment } from '../models/types';

export function useCommitments(): Commitment[] {
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  useEffect(() => {
    setCommitments(getAllCommitments());
    return onCommitmentsChange(setCommitments);
  }, []);

  return commitments;
}

export function useActiveCommitments(): Commitment[] {
  const commitments = useCommitments();

  return useMemo(() => {
    return commitments.filter((c) => c.status === 'active');
  }, [commitments]);
}

export function usePartCommitments(partId: string): Commitment[] {
  const commitments = useCommitments();

  return useMemo(() => {
    return commitments.filter((c) => c.partId === partId);
  }, [commitments, partId]);
}

// Legacy aliases
export const useLoans = useCommitments;
export const useActiveLoans = useActiveCommitments;
export const usePartLoans = usePartCommitments;
