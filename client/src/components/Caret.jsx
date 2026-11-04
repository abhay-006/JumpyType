import React from 'react';

export function Caret({ position, smooth, isBlinking }) {
  if (!position) return null;

  return (
    <div
      className={`caret ${smooth ? 'smooth' : ''} ${isBlinking ? 'blinking' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        height: `${position.height}px`,
      }}
      aria-hidden="true"
    />
  );
}

