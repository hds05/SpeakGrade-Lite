import { NextRequest, NextResponse } from "next/server";

interface TTSRequestBody {
  text: string;
}

interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
}

interface ElevenLabsRequestBody {
  text: string;
  voice_settings: ElevenLabsVoiceSettings;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { text }: TTSRequestBody = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const voice = "s3TPKV1kjDlVtZbl4Ksh"; // calm dispatcher voice ID
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        } as ElevenLabsRequestBody["voice_settings"],
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
    console.error("Error in tts route:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
