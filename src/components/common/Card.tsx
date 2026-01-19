import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div className={`card-pixel p-4 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
