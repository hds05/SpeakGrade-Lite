// ✅ src/app/api/weeklyCheckWithManager/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  speaker?: string;
  text?: string;
  conversation?: {
    text?: string;
  };
}

// Charlie's voice ID for the manager character
const CHARLIE_VOICE_ID = "WF4i4ZlVIKR1m1lLbJji";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: TTSRequest = await req.json();
    const speaker = body.speaker || "Charlie";
    const text = body.text || (body.conversation && body.conversation.text) || "";

    console.log("📥 Level 4 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Always use Charlie's voice for the manager
    const voiceId = CHARLIE_VOICE_ID;
    console.log(`🎙️ Using Charlie's voice for manager: ${voiceId}`);

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: 0.6,       // More stable for professional tone
            similarity_boost: 0.85, // Higher similarity for consistency
            style: 0.4,          // Professional style
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errorText = await elevenRes.text();
      console.error("❌ ElevenLabs error:", errorText);
      return NextResponse.json({ error: "ElevenLabs failed" }, { status: 502 });
    }

    console.log("✅ Level 4 /tts audio generated successfully");

    return new Response(elevenRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // ✅ allow browser fetch
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Level 4 tts error", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
