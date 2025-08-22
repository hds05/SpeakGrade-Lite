// ✅ src/app/api/outletCustomer/tts/route.ts
import { NextResponse } from "next/server";

// Alice's voice ID for the friendly cashier character
const ALICE_VOICE_ID = "BZgkqPqms7Kj9ulSkVzn";

export async function POST(req: Request) {
  try {
    let body = await req.json();
    let speaker = body.speaker ?? "Sarah";
    let text = body.text ?? body.conversation?.text ?? "";

    console.log("📥 Level 6 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Use Alice's voice for the friendly cashier
    const voiceId = ALICE_VOICE_ID;
    console.log(`🎙️ Using Alice's voice for cashier Sarah: ${voiceId}`);

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
            stability: 0.4,      // Friendly and animated
            similarity_boost: 0.7, // Good similarity
            style: 0.2,         // Warm, helpful style
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

    console.log("✅ Level 6 /tts audio generated successfully");

    return new Response(elevenRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // ✅ allow browser fetch
      },
    });
  } catch (err: any) {
    console.error("Level 6 tts error", err);
    return NextResponse.json({ error: err.message ?? err }, { status: 500 });
  }
} 