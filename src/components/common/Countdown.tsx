import { useState, useEffect } from 'react';

interface CountdownProps {
  deadline: string; // ISO date string
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalMinutes: number;
}

function calculateTimeRemaining(deadline: string): TimeRemaining {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOverdue: true,
      totalMinutes: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    isOverdue: false,
    totalMinutes,
  };
}

export function Countdown({ deadline }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(deadline)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (timeRemaining.isOverdue) {
    return (
      <span className="text-[var(--color-pixel-error)] font-bold countdown-urgent">
        OVERDUE
      </span>
    );
  }

  const isUrgent = timeRemaining.hours < 1;
  const urgentClass = isUrgent ? 'text-[var(--color-pixel-error)] countdown-urgent' : 'text-[var(--color-pixel-text)]';

  // Format display
  const displayText =
    timeRemaining.hours > 0
      ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
      : `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;

  return <span className={urgentClass}>{displayText}</span>;
}

export default Countdown;
