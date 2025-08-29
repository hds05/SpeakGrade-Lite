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
    
    // Add timeout and optimized settings for faster TTS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: text.substring(0, 500), // Limit text length for speed
          voice_settings: {
            stability: 0.4, // Slightly lower for faster generation
            similarity_boost: 0.7, // Slightly lower for speed
          } as ElevenLabsRequestBody["voice_settings"],
          model_id: "eleven_turbo_v2", // Use faster model if available
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("TTS request timed out");
        return NextResponse.json({ error: "TTS request timed out" }, { status: 408 });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in tts route:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
