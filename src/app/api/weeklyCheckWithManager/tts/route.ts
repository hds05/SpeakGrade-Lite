// ✅ src/app/api/weeklyCheckWithManager/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  speaker?: string;
  text?: string;
  conversation?: {
    text?: string;
  };
}

// Premade ElevenLabs voice (works with any valid API key). Same as SpacecraftSimulation / easyFastFood Adam.
const MANAGER_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not configured on the server" },
        { status: 503 }
      );
    }

    const body: TTSRequest = await req.json();
    const speaker = body.speaker || "Charlie";
    const text = body.text || (body.conversation && body.conversation.text) || "";

    console.log("📥 Level 4 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceId = MANAGER_VOICE_ID;
    console.log(`🎙️ Manager TTS voice: ${voiceId}`);

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.85,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errorText = await elevenRes.text();
      console.error("❌ ElevenLabs error:", elevenRes.status, errorText);

      return NextResponse.json(
        {
          error: "ElevenLabs failed",
          elevenlabsStatus: elevenRes.status,
          // Always return raw payload (truncated) so the client can show the real reason (quota/auth/voice/model/etc).
          errorText: (errorText ?? "").slice(0, 800),
        },
        { status: 502 }
      );
    }

    console.log("✅ Level 4 /tts audio generated successfully");

    return new NextResponse(elevenRes.body, {
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
