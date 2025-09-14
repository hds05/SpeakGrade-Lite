import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackElevenLabsUsage, canMakeAPICall } from "@/lib/apiTracking";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { text, voice = "onyx" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Check if user has enough credits before making TTS call
    const canProceed = await canMakeAPICall('elevenlabs', text.length, userId);
    
    if (!canProceed) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        message: "You don't have enough voice generation credits. Please purchase more credits." 
      }, { status: 402 });
    }

    // ElevenLabs API call
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      console.error("ElevenLabs API error:", response.status, response.statusText);
      return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Track ElevenLabs usage and deduct credits
    try {
      const usageTracking = await trackElevenLabsUsage(text, userId);
      if (usageTracking.success) {
        console.log(`✅ TTS Credits tracked: ${usageTracking.creditsUsed} used, ${usageTracking.remainingCredits} remaining`);
      }
    } catch (trackingError) {
      console.error("Error tracking TTS usage:", trackingError);
      // Continue execution - don't fail the request for tracking errors
    }
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

