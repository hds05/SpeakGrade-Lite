// ✅ src/app/api/level5/tts/route.ts
import { NextResponse } from "next/server";

// New voice ID for the police officer character
const OFFICER_VOICE_ID = "1CgVOaiK0YikcFJJHWV0";

export async function POST(req: Request) {
  try {
    let body = await req.json();
    let speaker = body.speaker ?? "Officer Davis";
    let text = body.text ?? body.conversation?.text ?? "";

    console.log("📥 Level 5 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Always use the new voice for the police officer
    const voiceId = OFFICER_VOICE_ID;
    console.log(`🎙️ Using new voice for officer: ${voiceId}`);

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          voice_settings: { 
            stability: 0.6,      // Stable for authoritative tone
            similarity_boost: 0.8, // High similarity for consistency
            style: 0.4,         // Slightly authoritative style
            use_speaker_boost: true
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errorText = await elevenRes.text();
      console.error("❌ ElevenLabs error:", errorText);
      return NextResponse.json({ error: "ElevenLabs failed" }, { status: 502 });
    }

    console.log("✅ Level 5 /tts audio generated successfully");

    return new Response(elevenRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // ✅ allow browser fetch
      },
    });
  } catch (err: any) {
    console.error("Level 5 tts error", err);
    return NextResponse.json({ error: err.message ?? err }, { status: 500 });
  }
}