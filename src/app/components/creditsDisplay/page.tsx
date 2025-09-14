'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface CreditStatus {
  openai: {
    available: number;
    used: number;
    percentage: number;
  };
  elevenlabs: {
    available: number;
    used: number;
    percentage: number;
  };
}

export default function CreditsDisplay() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/credits/status');
        if (response.ok) {
          const creditData = await response.json();
          setCredits(creditData);
        } else {
          console.error('Failed to fetch credits:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user, isLoaded]);

  if (!isLoaded || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-red-400/20">
        <p className="text-red-400 text-sm">Unable to load credits information</p>
      </div>
    );
  }

  const isLowCredits = credits.openai.available < 50 || credits.elevenlabs.available < 25;

  return (
    <div className={`backdrop-blur-md rounded-xl p-4 mb-6 border ${
      isLowCredits 
        ? 'bg-yellow-500/10 border-yellow-400/20' 
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          💳 Your Credits
          {isLowCredits && <span className="text-yellow-400 text-sm">⚠️ Low</span>}
        </h3>
        <button 
          onClick={() => window.location.href = '/purchase-credits'}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
        >
          Buy More
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* OpenAI Credits */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-200">🤖 AI Chat</span>
            <span className="text-sm font-semibold text-white">{credits.openai.available}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                credits.openai.percentage > 20 ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(credits.openai.percentage, 5)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-300">Used: {credits.openai.used}</p>
        </div>

        {/* ElevenLabs Credits */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-200">🎵 Voice</span>
            <span className="text-sm font-semibold text-white">{credits.elevenlabs.available}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                credits.elevenlabs.percentage > 20 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(credits.elevenlabs.percentage, 5)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-300">Used: {credits.elevenlabs.used}</p>
        </div>
      </div>

      {isLowCredits && (
        <div className="mt-3 p-2 bg-yellow-500/20 rounded-lg">
          <p className="text-yellow-200 text-xs">
            ⚠️ You're running low on credits. Consider purchasing more to continue using all features.
          </p>
        </div>
      )}
    </div>
  );
}
