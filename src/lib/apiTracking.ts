import { auth } from '@clerk/nextjs/server';
import { 
  getUserCredits, 
  deductCredits, 
  calculateCreditCost, 
  estimateTokens 
} from './credits';

/**
 * Track OpenAI API usage and deduct credits
 */
export async function trackOpenAIUsage(
  responseText: string,
  model: string = 'gpt-4o-mini',
  userId?: string
): Promise<{ success: boolean; creditsUsed: number; remainingCredits: number }> {
  let currentUserId = userId;
  
  if (!currentUserId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      throw new Error('User not authenticated');
    }
    currentUserId = authUserId;
  }

  try {
    // Estimate tokens used (in real implementation, you'd get this from OpenAI response)
    const tokensUsed = estimateTokens(responseText);
    const creditsRequired = calculateCreditCost('openai', tokensUsed, model);
    
    // Check if user has enough credits
    const userCredits = await getUserCredits(currentUserId);
    if (userCredits.openai_credits < creditsRequired) {
      return {
        success: false,
        creditsUsed: 0,
        remainingCredits: userCredits.openai_credits
      };
    }
    
    // Deduct credits
    const updatedCredits = await deductCredits(currentUserId, 'openai', creditsRequired);
    
    // Log usage (optional - could be enhanced with proper logging)
    console.log(`🔥 OpenAI usage tracked:`, {
      userId: currentUserId,
      model,
      tokensUsed,
      creditsUsed: creditsRequired,
      remainingCredits: updatedCredits.openai_credits
    });
    
    return {
      success: true,
      creditsUsed: creditsRequired,
      remainingCredits: updatedCredits.openai_credits
    };
  } catch (error) {
    console.error('Error tracking OpenAI usage:', error);
    throw error;
  }
}

/**
 * Track ElevenLabs API usage and deduct credits
 */
export async function trackElevenLabsUsage(
  text: string,
  userId?: string
): Promise<{ success: boolean; creditsUsed: number; remainingCredits: number }> {
  let currentUserId = userId;
  
  if (!currentUserId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      throw new Error('User not authenticated');
    }
    currentUserId = authUserId;
  }

  try {
    // Calculate credits based on character count
    const charactersUsed = text.length;
    const creditsRequired = calculateCreditCost('elevenlabs', charactersUsed);
    
    // Check if user has enough credits
    const userCredits = await getUserCredits(currentUserId);
    if (userCredits.elevenlabs_credits < creditsRequired) {
      return {
        success: false,
        creditsUsed: 0,
        remainingCredits: userCredits.elevenlabs_credits
      };
    }
    
    // Deduct credits
    const updatedCredits = await deductCredits(currentUserId, 'elevenlabs', creditsRequired);
    
    // Log usage
    console.log(`🎵 ElevenLabs usage tracked:`, {
      userId: currentUserId,
      charactersUsed,
      creditsUsed: creditsRequired,
      remainingCredits: updatedCredits.elevenlabs_credits
    });
    
    return {
      success: true,
      creditsUsed: creditsRequired,
      remainingCredits: updatedCredits.elevenlabs_credits
    };
  } catch (error) {
    console.error('Error tracking ElevenLabs usage:', error);
    throw error;
  }
}

/**
 * Check if user can make API calls (has sufficient credits)
 */
export async function canMakeAPICall(
  apiType: 'openai' | 'elevenlabs',
  estimatedUsage: number, // tokens for OpenAI, characters for ElevenLabs
  userId?: string
): Promise<boolean> {
  let currentUserId = userId;
  
  if (!currentUserId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return false;
    }
    currentUserId = authUserId;
  }

  try {
    const userCredits = await getUserCredits(currentUserId);
    const requiredCredits = calculateCreditCost(apiType, estimatedUsage);
    
    if (apiType === 'openai') {
      return userCredits.openai_credits >= requiredCredits;
    } else {
      return userCredits.elevenlabs_credits >= requiredCredits;
    }
  } catch (error) {
    console.error('Error checking API call permission:', error);
    return false;
  }
}

/**
 * Get user's current credit status for display
 */
export async function getUserCreditStatus(userId?: string) {
  let currentUserId = userId;
  
  if (!currentUserId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      throw new Error('User not authenticated');
    }
    currentUserId = authUserId;
  }

  try {
    const credits = await getUserCredits(currentUserId);
    
    return {
      openai: {
        available: credits.openai_credits,
        used: credits.total_openai_used,
        percentage: credits.total_openai_used > 0 
          ? Math.round((credits.openai_credits / (credits.openai_credits + credits.total_openai_used)) * 100)
          : 100
      },
      elevenlabs: {
        available: credits.elevenlabs_credits,
        used: credits.total_elevenlabs_used,
        percentage: credits.total_elevenlabs_used > 0
          ? Math.round((credits.elevenlabs_credits / (credits.elevenlabs_credits + credits.total_elevenlabs_used)) * 100)
          : 100
      }
    };
  } catch (error) {
    console.error('Error getting credit status:', error);
    throw error;
  }
}
