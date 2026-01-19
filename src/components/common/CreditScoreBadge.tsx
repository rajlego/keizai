interface CreditScoreBadgeProps {
  score: number;
}

function getCreditScoreColor(score: number): string {
  if (score >= 750) return 'bg-green-500'; // Excellent
  if (score >= 700) return 'bg-lime-500'; // Good
  if (score >= 650) return 'bg-yellow-500'; // Fair
  if (score >= 600) return 'bg-orange-500'; // Poor
  return 'bg-red-500'; // Bad
}

function getCreditScoreLabel(score: number): string {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  if (score >= 600) return 'Poor';
  return 'Bad';
}

export function CreditScoreBadge({ score }: CreditScoreBadgeProps) {
  const colorClass = getCreditScoreColor(score);
  const label = getCreditScoreLabel(score);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 ${colorClass} text-white text-[10px] border-2 border-white/20`}
      title={`Credit Score: ${label}`}
    >
      <span className="font-bold">{score}</span>
    </div>
  );
}

export default CreditScoreBadge;
