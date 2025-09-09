"use client";

import React, { useEffect, useState } from 'react';

interface WaveRipple {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface ClickWaveEffectProps {
  children: React.ReactNode;
  enabled?: boolean;
  waveColor?: string;
  waveSize?: number;
  duration?: number;
}

export default function ClickWaveEffect({ 
  children, 
  enabled = true,
  waveColor = 'rgba(59, 130, 246, 0.6)', // Blue by default
  waveSize = 40,
  duration = 600
}: ClickWaveEffectProps) {
  const [ripples, setRipples] = useState<WaveRipple[]>([]);

  const createRipple = (event: MouseEvent) => {
    if (!enabled) return;

    const newRipple: WaveRipple = {
      id: Date.now() + Math.random(),
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('click', createRipple);
    return () => document.removeEventListener('click', createRipple);
  }, [enabled, duration]);

  return (
    <>
      {children}
      
      {/* Ripple Effects Container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute rounded-full animate-wave-ripple"
            style={{
              left: ripple.x - waveSize / 2,
              top: ripple.y - waveSize / 2,
              width: waveSize,
              height: waveSize,
              background: `radial-gradient(circle, ${waveColor} 0%, transparent 70%)`,
              animationDuration: `${duration}ms`,
              transform: 'scale(0)',
            }}
          />
        ))}
      </div>

      {/* CSS Animation Styles */}
      <style jsx global>{`
        @keyframes wave-ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        .animate-wave-ripple {
          animation: wave-ripple ease-out forwards;
        }

        /* Optional: Add a subtle shake effect to the clicked element */
        @keyframes click-shake {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-1px, -1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, 1px); }
        }

        .click-shake {
          animation: click-shake 0.2s ease-in-out;
        }
      `}</style>
    </>
  );
}
