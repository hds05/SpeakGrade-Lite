# 🚀 Clerk Authentication + API Credit Tracking Setup

## ✅ Files Created/Modified

### 🆕 New Files Created:
- `middleware.ts` - Clerk authentication middleware
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page  
- `src/lib/credits.ts` - Credit management utilities
- `src/lib/apiTracking.ts` - API usage tracking utilities
- `src/app/components/creditsDisplay/page.tsx` - Credits display component
- `src/app/api/credits/status/route.ts` - Credits status API endpoint

### 📝 Modified Files:
- `src/app/layout.tsx` - Added ClerkProvider
- `src/app/purchase/page.tsx` - Redirect to sign-up after purchase
- `src/clientLayout.tsx` - Added credits display component
- `src/app/api/easyFastFood/respond/route.ts` - Added credit tracking (example)
- `src/app/api/easyFastFood/tts/route.ts` - Added credit tracking (example)

## 📦 Required Package Installations

Run these commands to install required packages:

```bash
npm install @clerk/nextjs @clerk/clerk-sdk-node
```

## 🔑 Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Clerk URLs (optional - defaults shown)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Your existing API keys
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 🏗️ Setup Steps

### 1. Create Clerk Application
1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the publishable key and secret key to your `.env.local`

### 2. Configure Clerk Dashboard
In your Clerk dashboard:
- **User & Authentication → Email, Phone, Username**: Configure sign-up methods
- **User & Authentication → Social Connections**: Add social providers if desired
- **Paths**: Verify redirect URLs match your environment variables

### 3. Test the Flow
1. Start your development server: `npm run dev`
2. Go to `/purchase` and complete a mock purchase
3. You should be redirected to `/sign-up?purchased=true`
4. Create an account - you'll get initial credits automatically
5. Access `/dashboard` to see your credits

## 🎯 How It Works

### **Simpler Approach (Implemented)**
- **User Data**: Stored in Clerk's user metadata (no separate database needed)
- **Credits**: Stored as JSON in `user.publicMetadata.credits`
- **API Tracking**: Real-time credit deduction on each API call
- **Credit Display**: Live updates shown on dashboard

### **Credit System**
```typescript
// Initial credits per user
{
  openai_credits: 1000,      // ~10,000 tokens worth
  elevenlabs_credits: 500,   // ~500 characters worth
  total_openai_used: 0,
  total_elevenlabs_used: 0
}
```

### **Credit Costs**
- **OpenAI**: 0.1 credits per 1000 tokens (gpt-4o-mini)
- **ElevenLabs**: 1 credit per character

## 🔄 Flow Diagram

```
Purchase → Sign-up → Dashboard → Conversation → API Call → Credit Check → Deduct Credits
```

## 📈 Current Implementation Status

### ✅ Completed:
- Clerk authentication setup
- User registration after purchase
- Credit system using Clerk metadata
- API credit tracking (example routes)
- Credits display component
- Insufficient credits handling

### 🔄 To Apply to All Routes:
You need to update the remaining API routes with the same pattern as `easyFastFood`. Here's the template:

```typescript
// At the top of each route file:
import { auth } from "@clerk/nextjs";
import { trackOpenAIUsage, canMakeAPICall } from "@/lib/apiTracking";

// In POST function:
const { userId } = auth();
if (!userId) {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

// Before API call:
const canProceed = await canMakeAPICall('openai', estimatedTokens, userId);
if (!canProceed) {
  return NextResponse.json({ 
    error: "Insufficient credits", 
    message: "You don't have enough credits to continue." 
  }, { status: 402 });
}

// After successful API response:
const usageTracking = await trackOpenAIUsage(responseText, 'gpt-4o-mini', userId);
```

## 🛠️ Next Steps

1. **Apply to all API routes**: Update remaining 22 API endpoints with credit tracking
2. **Purchase credits page**: Create `/purchase-credits` for buying more credits  
3. **Admin dashboard**: Monitor user usage and credit purchases
4. **Rate limiting**: Add per-user rate limiting
5. **Analytics**: Track popular scenarios and usage patterns

## 🔍 Testing

### Test Credit System:
1. Sign up as a new user
2. Check initial credits on dashboard
3. Use a conversation scenario
4. Watch credits decrease in real-time
5. Try using when credits are depleted

### Test Authentication:
1. Try accessing `/dashboard` without login → should redirect to sign-in
2. Complete purchase → should redirect to sign-up
3. Sign up → should go to dashboard with credits

## 🚨 Important Notes

- **Credits are per-user**: Each Clerk user gets their own credit allocation
- **No database required**: Everything stored in Clerk metadata (scales to ~1KB per user)
- **Real-time tracking**: Credits update immediately on each API call
- **Graceful degradation**: Credit tracking errors don't break conversations
- **Security**: All credit operations happen server-side

## 🎉 Benefits

- **Easy setup**: No database configuration needed
- **Scalable**: Clerk handles user management
- **Cost control**: Precise tracking of API usage
- **User experience**: Real-time credit display
- **Flexible**: Easy to add credit purchases later

Your implementation is now ready! Users will get 1000 OpenAI credits and 500 ElevenLabs credits when they sign up after purchase. 🎊
