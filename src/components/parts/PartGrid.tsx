import { useState, useEffect } from 'react';
import type { Part } from '../../models/types';
import { getAllParts, onPartsChange } from '../../sync/yjsProvider';
import { PartCard } from './PartCard';
import { useUIStore } from '../../store/uiStore';

export function PartGrid() {
  const [parts, setParts] = useState<Part[]>([]);
  const selectPart = useUIStore((state) => state.selectPart);

  useEffect(() => {
    // Initial load
    setParts(getAllParts());

    // Subscribe to changes
    const unsubscribe = onPartsChange((updatedParts) => {
      setParts(updatedParts);
    });

    return () => unsubscribe();
  }, []);

  const handlePartClick = (part: Part) => {
    selectPart(part.id);
    // Just select the part, don't navigate away
  };

  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-[40px] mb-4">?</div>
        <p className="text-[var(--color-pixel-text-dim)] text-[12px] mb-2">
          No parts yet
        </p>
        <p className="text-[var(--color-pixel-text-dim)] text-[10px]">
          Create a part to get started with Keizai
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {parts.map((part) => (
        <PartCard
          key={part.id}
          part={part}
          onClick={() => handlePartClick(part)}
        />
      ))}
    </div>
  );
}

export default PartGrid;
