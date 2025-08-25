import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Using a more sophisticated voice ID for JARVIS - Antoni voice for professional AI assistant
    const voice = "VR6AewLTigWG4xSOukaG"; // Antoni voice - perfect for JARVIS
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.9,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("ElevenLabs error:", err);
      return NextResponse.json({ error: "TTS request failed" }, { status: 500 });
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error in SpacecraftSimulation tts route:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
