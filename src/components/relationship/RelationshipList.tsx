import type { Part, Relationship } from '../../models/types';
import { RelationshipCard } from './RelationshipCard';

interface PartWithRelationship {
  part: Part;
  relationship: Relationship;
}

interface RelationshipListProps {
  partsWithRelationships: PartWithRelationship[];
  onSelectPart?: (partId: string) => void;
  compact?: boolean;
  sortBy?: 'level' | 'name' | 'recent';
}

export function RelationshipList({
  partsWithRelationships,
  onSelectPart,
  compact = false,
  sortBy = 'level',
}: RelationshipListProps) {
  // Sort parts
  const sortedParts = [...partsWithRelationships].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.relationship.level - a.relationship.level ||
               b.relationship.experience - a.relationship.experience;
      case 'name':
        return a.part.name.localeCompare(b.part.name);
      case 'recent':
        return new Date(b.relationship.lastInteractionAt).getTime() -
               new Date(a.relationship.lastInteractionAt).getTime();
      default:
        return 0;
    }
  });

  // Calculate aggregate stats
  const totalLevel = partsWithRelationships.reduce((sum, p) => sum + p.relationship.level, 0);
  const averageLevel = partsWithRelationships.length > 0
    ? (totalLevel / partsWithRelationships.length).toFixed(1)
    : '0';
  const maxedRelationships = partsWithRelationships.filter(p => p.relationship.level >= 10).length;

  if (partsWithRelationships.length === 0) {
    return (
      <div className="text-center p-8 text-[var(--color-pixel-text-dim)]">
        <div className="text-2xl mb-2">👥</div>
        <div className="text-[10px]">No relationships yet</div>
        <div className="text-[9px] mt-1">Talk to parts to build relationships</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-[var(--color-pixel-bg)] border-2 border-[var(--color-pixel-secondary)]">
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Total</div>
          <div className="text-[14px] text-[var(--color-pixel-accent)]">
            {partsWithRelationships.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Avg Level</div>
          <div className="text-[14px] text-[var(--color-pixel-primary)]">
            {averageLevel}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[8px] text-[var(--color-pixel-text-dim)]">Maxed</div>
          <div className="text-[14px] text-[var(--color-pixel-success)]">
            {maxedRelationships}
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex gap-1 text-[8px]">
        <span className="text-[var(--color-pixel-text-dim)]">Sort by:</span>
        <button
          className={sortBy === 'level' ? 'text-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}
        >
          Level
        </button>
        <span className="text-[var(--color-pixel-text-dim)]">•</span>
        <button
          className={sortBy === 'name' ? 'text-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}
        >
          Name
        </button>
        <span className="text-[var(--color-pixel-text-dim)]">•</span>
        <button
          className={sortBy === 'recent' ? 'text-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}
        >
          Recent
        </button>
      </div>

      {/* Relationship cards */}
      <div className={compact ? 'space-y-2' : 'grid gap-3 md:grid-cols-2'}>
        {sortedParts.map(({ part, relationship }) => (
          <RelationshipCard
            key={part.id}
            part={part}
            relationship={relationship}
            compact={compact}
            onClick={onSelectPart ? () => onSelectPart(part.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
