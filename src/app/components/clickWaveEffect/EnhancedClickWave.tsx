"use client";

import React, { useEffect, useState } from 'react';

interface WaveRipple {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  type: 'blast' | 'ripple' | 'shockwave';
}

interface EnhancedClickWaveProps {
  children: React.ReactNode;
  enabled?: boolean;
  effectType?: 'blast' | 'ripple' | 'shockwave' | 'all';
  intensity?: 'low' | 'medium' | 'high';
  theme?: 'blue' | 'green' | 'purple' | 'orange' | 'rainbow';
}

export default function EnhancedClickWave({ 
  children, 
  enabled = true,
  effectType = 'ripple',
  intensity = 'medium',
  theme = 'blue'
}: EnhancedClickWaveProps) {
  const [ripples, setRipples] = useState<WaveRipple[]>([]);

  // Theme colors
  const themes = {
    blue: 'rgba(59, 130, 246, 0.6)',
    green: 'rgba(34, 197, 94, 0.6)',
    purple: 'rgba(147, 51, 234, 0.6)',
    orange: 'rgba(249, 115, 22, 0.6)',
    rainbow: 'linear-gradient(45deg, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6), rgba(249, 115, 22, 0.6))'
  };

  // Intensity settings
  const intensitySettings = {
    low: { waveSize: 30, duration: 400, particles: 1 },
    medium: { waveSize: 50, duration: 600, particles: 2 },
    high: { waveSize: 80, duration: 800, particles: 3 }
  };

  const settings = intensitySettings[intensity];
  const waveColor = themes[theme];

  const createRipple = (event: MouseEvent) => {
    if (!enabled) return;

    const types: Array<'blast' | 'ripple' | 'shockwave'> = 
      effectType === 'all' ? ['blast', 'ripple', 'shockwave'] : [effectType as any];

    // Create multiple particles for higher intensity
    for (let i = 0; i < settings.particles; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];
      const offset = i * 15; // Slight offset for multiple particles
      
      const newRipple: WaveRipple = {
        id: Date.now() + Math.random() + i,
        x: event.clientX + (Math.random() - 0.5) * offset,
        y: event.clientY + (Math.random() - 0.5) * offset,
        timestamp: Date.now(),
        type: randomType
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, settings.duration + i * 100);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('click', createRipple);
    return () => document.removeEventListener('click', createRipple);
  }, [enabled, settings.duration]);

  const getRippleStyle = (ripple: WaveRipple) => {
    const baseStyle = {
      left: ripple.x - settings.waveSize / 2,
      top: ripple.y - settings.waveSize / 2,
      width: settings.waveSize,
      height: settings.waveSize,
      animationDuration: `${settings.duration}ms`,
    };

    switch (ripple.type) {
      case 'blast':
        return {
          ...baseStyle,
          background: `radial-gradient(circle, ${waveColor} 0%, rgba(255, 255, 255, 0.3) 30%, transparent 70%)`,
          boxShadow: `0 0 20px ${waveColor}`,
        };
      case 'shockwave':
        return {
          ...baseStyle,
          border: `2px solid ${waveColor.replace('0.6', '0.8')}`,
          background: 'transparent',
        };
      default: // ripple
        return {
          ...baseStyle,
          background: `radial-gradient(circle, ${waveColor} 0%, transparent 70%)`,
        };
    }
  };

  return (
    <>
      {children}
      
      {/* Ripple Effects Container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className={`absolute rounded-full ${
              ripple.type === 'blast' ? 'animate-blast-wave' :
              ripple.type === 'shockwave' ? 'animate-shock-wave' :
              'animate-ripple-wave'
            }`}
            style={getRippleStyle(ripple)}
          />
        ))}
      </div>

      {/* Enhanced CSS Animation Styles */}
      <style jsx global>{`
        @keyframes ripple-wave {
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

        @keyframes blast-wave {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          30% {
            transform: scale(1) rotate(45deg);
            opacity: 0.9;
          }
          70% {
            transform: scale(2.5) rotate(90deg);
            opacity: 0.4;
          }
          100% {
            transform: scale(4) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes shock-wave {
          0% {
            transform: scale(0);
            opacity: 1;
            border-width: 3px;
          }
          50% {
            transform: scale(2);
            opacity: 0.6;
            border-width: 2px;
          }
          100% {
            transform: scale(4);
            opacity: 0;
            border-width: 1px;
          }
        }

        .animate-ripple-wave {
          animation: ripple-wave ease-out forwards;
        }

        .animate-blast-wave {
          animation: blast-wave ease-out forwards;
        }

        .animate-shock-wave {
          animation: shock-wave ease-out forwards;
        }

        /* Screen shake effect for high intensity */
        @keyframes screen-shake {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-1px, -1px); }
          20% { transform: translate(1px, -1px); }
          30% { transform: translate(-1px, 1px); }
          40% { transform: translate(1px, 1px); }
          50% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, -1px); }
          70% { transform: translate(-1px, 1px); }
          80% { transform: translate(1px, 1px); }
          90% { transform: translate(-1px, -1px); }
        }

        .screen-shake {
          animation: screen-shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}
