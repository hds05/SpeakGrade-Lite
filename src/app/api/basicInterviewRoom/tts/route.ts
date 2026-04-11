import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  text: string;
  voice?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY no está configurada",
          detail:
            "Añade OPENAI_API_KEY en SpeakGrade-Lite/.env.local y reinicia el servidor (npm run dev).",
        },
        { status: 503 }
      );
    }

    const { text, voice = "nova" }: TTSRequest = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required for TTS" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI TTS API error:", response.status, errorText);

      let detail = errorText;
      try {
        const parsed = JSON.parse(errorText) as {
          error?: { message?: string; code?: string; type?: string };
        };
        if (parsed?.error?.message) {
          detail = parsed.error.message;
        }
      } catch {
        /* keep raw text */
      }

      return NextResponse.json(
        {
          error: "Failed to generate speech",
          detail,
          hint:
            response.status === 401 || response.status === 403
              ? "Revisa que la API key sea válida, tenga acceso a TTS (Audio) en platform.openai.com y que la cuenta tenga crédito o facturación activa."
              : undefined,
        },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error in Basic Interview Room TTS:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
