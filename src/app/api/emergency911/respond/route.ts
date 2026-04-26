import { NextRequest, NextResponse } from "next/server";
import { debugLog, debugWarn } from "@/lib/debugLog";

interface Message {
  role: string;
  content: string;
  speaker?: string;
}

interface ConversationResponse {
  speaker: string;
  text: string;
}

interface RequestBody {
  transcript?: string;
  conversationHistory?: Message[];
  questionCount?: number;
}

// Add this function before POST
async function callOpenAI(messages: Message[]): Promise<string> {
  debugLog("🔑 OpenAI API Key present:", !!process.env.OPENAI_API_KEY);
  debugLog("📡 Making request to OpenAI with", messages.length, "messages");

  const requestBody = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.2,
    max_tokens: 100,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
    response_format: { type: "json_object" }, // Force JSON response
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

  debugLog("📥 OpenAI response status:", res.status, res.statusText);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ OpenAI API error response:", errorText);
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }

  const payload = await res.json();
  // Evita loggear payload completo (puede ser grande y ralentiza).
  debugLog("📦 OpenAI response payload received");
  
  const content = payload.choices?.[0]?.message?.content ?? "";
  debugLog("📝 Extracted content length:", content?.length ?? 0);
  
  return content;
}

// ✅ Your POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    debugLog("✅ Emergency911 /respond received:", {
      hasTranscript: !!body.transcript,
      transcriptLen: body.transcript?.length ?? 0,
      historyLen: body.conversationHistory?.length ?? 0,
      questionCount: body.questionCount ?? 0,
    });

    const { transcript, conversationHistory = [], questionCount = 0 } = body;

    // Recorta historial para reducir latencia/costo.
    const trimmedHistory =
      conversationHistory.length > 10
        ? conversationHistory.slice(-10)
        : conversationHistory;

    const systemMsg: Message = {
      role: "system",
      content: `You are a 9-11 dispatcher. Be brief, direct, and professional. Ask ONE question at a time.

      Current question: ${questionCount}

      Key topics to cover:
      1. What happened
      2. Where (location)
      3. Who's hurt, or if not what other emergency is it
      4. Stay on line
      5. Slightly acknowledge the caller's response

      Examples:
      - "Nine one one, what's your emergency?"
      - "Where is this happening?"
      - "Is anyone hurt?"
      - "Help is on the way."

      Keep responses under 27 words. Be realistic but supportive.

      IMPORTANT: You MUST respond ONLY with a valid JSON object in this exact format:
      {"speaker":"911 Dispatcher","text":"your response here"}

      Do not include any text before or after the JSON. Do not add explanations.`,
    };
    
    const userPrompt: Message = {
      role: "user",
      content: transcript
        ? `Caller said: "${transcript}". Continue the emergency call conversation naturally.`
        : `Start the emergency call by asking what the emergency is.`,
    };
    
    let content;
    try {
      debugLog("📤 Calling OpenAI:", {
        historyLength: trimmedHistory.length,
        userPromptLen: userPrompt.content.length,
        questionCount,
      });
      
      content = await callOpenAI([systemMsg, ...trimmedHistory, userPrompt]);
      
      debugLog("🧠 GPT raw response length:", content?.length || 0);
      
    } catch (error) {
      console.error("❌ OpenAI API call failed:");
      console.error("- Error type:", typeof error);
      console.error("- Error message:", error instanceof Error ? error.message : error);
      console.error("- Full error:", error);
      content = null;
    }

    let json: ConversationResponse | null = null;
    if (content && content.trim()) {
      debugLog("🔄 Attempting to parse JSON response...");

      // First try direct parsing
      try {
        json = JSON.parse(content.trim());
        debugLog("✅ Parsed JSON directly");
      } catch (parseError) {
        debugWarn(
          "⚠️ Direct JSON parse failed:",
          parseError instanceof Error ? parseError.message : parseError
        );

        // Try multiple regex patterns to extract JSON
        const patterns = [
          /\{[\s\S]*?\}/, // Basic JSON object
          /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, // Nested JSON
          /"speaker"[^}]*\}/, // Speaker-focused extraction
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            debugLog("🔍 Found potential JSON match");
            try {
              json = JSON.parse(match[0]);
              debugLog("✅ Parsed extracted JSON");
              break; // Stop trying other patterns if successful
            } catch (extractError) {
              debugWarn("⚠️ Pattern failed, trying next pattern");
              continue;
            }
          }
        }

        if (!json) {
          console.error("❌ No JSON pattern worked for content:", content);
        }
      }
    } else {
      debugWarn("⚠️ No content received from OpenAI");
    }

    // Fallback responses based on question count
    if (!json) {
      debugWarn("⚠️ 🔴 USING FALLBACK - No valid JSON response from OpenAI");
      const fallbackQuestions = [
        "Nine one one, what's your emergency?",
        "Can you tell me exactly where this is happening?",
        "What type of emergency is this?",
        "Are there any injuries? How many people are hurt?",
        "Is anyone in immediate danger right now?",
        "Please stay on the line. Help is on the way.",
        "Emergency services are responding. Stay calm and stay on the line.",
        "Help is arriving. Please remain on the line until they get there.",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "911 Dispatcher", 
        text: fallbackQuestions[questionIndex]
      };
    }

    debugLog("📤 Emergency911 /respond sending (compact):", {
      speaker: json.speaker,
      textLen: json.text.length,
    });
    
    return NextResponse.json({ 
      conversation: json
    });
  } catch (err) {
    console.error("❌ Emergency911 respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}