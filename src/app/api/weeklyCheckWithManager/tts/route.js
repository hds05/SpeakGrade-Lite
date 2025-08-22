// ✅ src/app/api/level4/tts/route.js
import { NextResponse } from "next/server";

// Charlie's voice ID for the manager character
const CHARLIE_VOICE_ID = "WF4i4ZlVIKR1m1lLbJji";

export async function POST(req) {
  try {
    const body = await req.json();
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
            stability: 0.5,       // Slightly more stable for professional tone
            similarity_boost: 0.8, // Higher similarity for consistency
            style: 0.3,          // Slightly professional style
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
  } catch (err) {
    console.error("Level 4 tts error", err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
