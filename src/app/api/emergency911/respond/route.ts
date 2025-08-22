import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  transcript?: string;
  conversationHistory?: Message[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { transcript, conversationHistory = [] }: RequestBody = await req.json();
  
    const messages: Message[] = [
      {
        role: "system",
        content: `
  You are a 911 dispatcher. Ask concise questions. Get emergency type, location, condition, and confirm help is coming. Be calm.
  End with: "Please stay on the line until emergency services arrive."`,
      },
      ...conversationHistory,
    ];
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const payload = await response.json();
    const reply = payload.choices?.[0]?.message?.content || "Can you repeat that?";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("❌ Emergency911 respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
