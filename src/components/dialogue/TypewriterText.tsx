import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;           // ms per character
  onComplete?: () => void;
  isStreaming?: boolean;    // If true, text is being added externally
  className?: string;
}

export function TypewriterText({
  text,
  speed = 30,
  onComplete,
  isStreaming = false,
  className = '',
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle streaming mode - just display the text as-is
  useEffect(() => {
    if (isStreaming) {
      setDisplayedText(text);
      return;
    }

    // Reset when text changes
    if (text !== displayedText && indexRef.current >= text.length) {
      indexRef.current = 0;
      setIsComplete(false);
    }

    // Typewriter animation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (indexRef.current < text.length) {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, isStreaming, onComplete]);

  // Skip to end on click
  const handleClick = () => {
    if (!isComplete && !isStreaming) {
      indexRef.current = text.length;
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
    }
  };

  return (
    <span
      className={`${className} ${!isComplete && !isStreaming ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {displayedText}
      {!isComplete && !isStreaming && (
        <span className="animate-pulse">▌</span>
      )}
      {isStreaming && (
        <span className="animate-pulse">●</span>
      )}
    </span>
  );
}
