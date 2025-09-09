import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  text: string;
  voice?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { text, voice = "shimmer" }: TTSRequest = await req.json();

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
      return NextResponse.json(
        { error: "Failed to generate speech" },
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
    console.error("Error in Easy Outlet Customer TTS:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
