import { createClerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

// Credit configuration
export const INITIAL_CREDITS = {
  openai_credits: 1000,     // For conversation responses
  elevenlabs_credits: 500,  // For text-to-speech
};

export const CREDIT_COSTS = {
  openai: {
    'gpt-4o-mini': 0.1,  // credits per 1000 tokens
    'gpt-4': 0.5,
  },
  elevenlabs: {
    'per_character': 1,   // 1 credit per character
  }
};

// User credit interface
export interface UserCredits {
  openai_credits: number;
  elevenlabs_credits: number;
  total_openai_used: number;
  total_elevenlabs_used: number;
}

/**
 * Get user credits from Clerk metadata
 */
export async function getUserCredits(userId?: string): Promise<UserCredits> {
  let currentUserId = userId;
  
  if (!currentUserId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      throw new Error('User not authenticated');
    }
    currentUserId = authUserId;
  }

  console.log('🔍 Getting credits for user:', currentUserId);

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    console.warn(
      '[credits] CLERK_SECRET_KEY is not set. Returning default credits for display only (not saved to Clerk). Add CLERK_SECRET_KEY to .env.local to enable real balances.'
    );
    return {
      ...INITIAL_CREDITS,
      total_openai_used: 0,
      total_elevenlabs_used: 0,
    };
  }

  try {
    console.log('📞 Creating Clerk client and getting user...');
    const clerkClient = createClerkClient({ secretKey });
    const user = await clerkClient.users.getUser(currentUserId);
    console.log('✅ User retrieved successfully:', {
      id: user.id,
      emailAddresses: user.emailAddresses.map(e => e.emailAddress),
      hasPublicMetadata: !!user.publicMetadata,
      publicMetadataKeys: Object.keys(user.publicMetadata || {})
    });
    
    const credits = user.publicMetadata.credits as UserCredits | undefined;
    console.log('💳 Existing credits:', credits);
    
    if (!credits) {
      console.log('🆕 No credits found, initializing for new user...');
      // Initialize credits for new user
      const initialCredits: UserCredits = {
        ...INITIAL_CREDITS,
        total_openai_used: 0,
        total_elevenlabs_used: 0,
      };
      
      console.log('📝 Updating user metadata with initial credits:', initialCredits);
      await clerkClient.users.updateUserMetadata(currentUserId, {
        publicMetadata: {
          ...user.publicMetadata,
          credits: initialCredits,
        }
      });
      
      console.log('✅ Credits initialized successfully');
      return initialCredits;
    }
    
    console.log('✅ Returning existing credits');
    return credits;
  } catch (error) {
    console.error('❌ Failed to retrieve user credits:', error);
    console.error('📋 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: currentUserId
    });
    throw new Error('Failed to retrieve user credits');
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(
  userId: string, 
  updates: Partial<UserCredits>
): Promise<UserCredits> {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new Error(
        'CLERK_SECRET_KEY is not configured. Set it in .env.local to enable credit updates.'
      );
    }

    const currentCredits = await getUserCredits(userId);
    const newCredits = { ...currentCredits, ...updates };
    
    const clerkClient = createClerkClient({ secretKey });
    const user = await clerkClient.users.getUser(userId);
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        credits: newCredits,
      }
    });
    
    return newCredits;
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw new Error('Failed to update user credits');
  }
}

/**
 * Check if user has enough credits
 */
export function hasEnoughCredits(
  userCredits: UserCredits,
  apiType: 'openai' | 'elevenlabs',
  requiredCredits: number
): boolean {
  if (apiType === 'openai') {
    return userCredits.openai_credits >= requiredCredits;
  } else {
    return userCredits.elevenlabs_credits >= requiredCredits;
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  userId: string,
  apiType: 'openai' | 'elevenlabs',
  creditsToDeduct: number
): Promise<UserCredits> {
  const currentCredits = await getUserCredits(userId);
  
  if (!hasEnoughCredits(currentCredits, apiType, creditsToDeduct)) {
    throw new Error(`Insufficient ${apiType} credits`);
  }
  
  const updates: Partial<UserCredits> = {};
  
  if (apiType === 'openai') {
    updates.openai_credits = currentCredits.openai_credits - creditsToDeduct;
    updates.total_openai_used = currentCredits.total_openai_used + creditsToDeduct;
  } else {
    updates.elevenlabs_credits = currentCredits.elevenlabs_credits - creditsToDeduct;
    updates.total_elevenlabs_used = currentCredits.total_elevenlabs_used + creditsToDeduct;
  }
  
  return await updateUserCredits(userId, updates);
}

/**
 * Estimate tokens from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

/**
 * Calculate credit cost for API usage
 */
export function calculateCreditCost(
  apiType: 'openai' | 'elevenlabs',
  usage: number, // tokens for OpenAI, characters for ElevenLabs
  model?: string
): number {
  if (apiType === 'openai') {
    const modelCost = CREDIT_COSTS.openai[model as keyof typeof CREDIT_COSTS.openai] || CREDIT_COSTS.openai['gpt-4o-mini'];
    return Math.ceil((usage / 1000) * modelCost);
  } else {
    return Math.ceil(usage * CREDIT_COSTS.elevenlabs.per_character);
  }
}

/**
 * Add credits to user account (for purchases or promotions)
 */
export async function addCredits(
  userId: string,
  openaiCredits: number = 0,
  elevenlabsCredits: number = 0
): Promise<UserCredits> {
  const currentCredits = await getUserCredits(userId);
  
  const updates: Partial<UserCredits> = {};
  
  if (openaiCredits > 0) {
    updates.openai_credits = currentCredits.openai_credits + openaiCredits;
  }
  
  if (elevenlabsCredits > 0) {
    updates.elevenlabs_credits = currentCredits.elevenlabs_credits + elevenlabsCredits;
  }
  
  return await updateUserCredits(userId, updates);
}
