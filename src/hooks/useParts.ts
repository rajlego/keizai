import { useState, useEffect } from 'react';
import { getAllParts, onPartsChange } from '../sync/yjsProvider';
import type { Part } from '../models/types';

export function useParts(): Part[] {
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    setParts(getAllParts());
    return onPartsChange(setParts);
  }, []);

  return parts;
}
