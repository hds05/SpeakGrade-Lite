import { NextRequest, NextResponse } from "next/server";

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
  console.log("🔑 OpenAI API Key present:", !!process.env.OPENAI_API_KEY);
  console.log("📡 Making request to OpenAI with", messages.length, "messages");
  
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
  
  console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

  console.log("📥 OpenAI response status:", res.status, res.statusText);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ OpenAI API error response:", errorText);
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }

  const payload = await res.json();
  console.log("📦 OpenAI response payload:", JSON.stringify(payload, null, 2));
  
  const content = payload.choices?.[0]?.message?.content ?? "";
  console.log("📝 Extracted content:", content);
  
  return content;
}

// ✅ Your POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    console.log("✅ Received body in Emergency911 /respond:", body);

    const { transcript, conversationHistory = [], questionCount = 0 } = body;

    // Emergency context that the AI dispatcher should reference
    const emergencyContext = `
    EMERGENCY DISPATCHER PROTOCOL (for dispatcher reference only):
    - Get emergency type (accident, fire, medical, etc.)
    - Get specific location (address, cross streets, landmarks)
    - Assess victim condition (conscious, breathing, bleeding, etc.)
    - Confirm caller understands to stay on the line
    - Provide reassurance and clear instructions
    - Current question count: ${questionCount}
    `;

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
      console.log("📤 Calling OpenAI with messages:", {
        systemMsg: systemMsg.content.substring(0, 200) + "...",
        historyLength: conversationHistory.length,
        userPrompt: userPrompt.content,
        questionCount
      });
      
      content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
      
      console.log("🧠 GPT raw response received:");
      console.log("- Type:", typeof content);
      console.log("- Length:", content?.length || 0);
      console.log("- Content:", content);
      
    } catch (error) {
      console.error("❌ OpenAI API call failed:");
      console.error("- Error type:", typeof error);
      console.error("- Error message:", error instanceof Error ? error.message : error);
      console.error("- Full error:", error);
      content = null;
    }

    let json: ConversationResponse | null = null;
    if (content && content.trim()) {
      console.log("🔄 Attempting to parse JSON response...");
      console.log("📄 Raw content:", content);

      // First try direct parsing
      try {
        json = JSON.parse(content.trim());
        console.log("✅ Successfully parsed JSON directly:", json);
      } catch (parseError) {
        console.warn("⚠️ Direct JSON parse failed:", parseError instanceof Error ? parseError.message : parseError);
        console.log("🔍 Trying to extract JSON from response...");

        // Try multiple regex patterns to extract JSON
        const patterns = [
          /\{[\s\S]*?\}/, // Basic JSON object
          /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/, // Nested JSON
          /"speaker"[^}]*\}/, // Speaker-focused extraction
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            console.log("🔍 Found potential JSON match with pattern:", pattern);
            console.log("🔍 Match:", match[0]);
            try {
              json = JSON.parse(match[0]);
              console.log("✅ Successfully parsed extracted JSON:", json);
              break; // Stop trying other patterns if successful
            } catch (extractError) {
              console.warn("⚠️ Pattern failed, trying next pattern");
              continue;
            }
          }
        }

        if (!json) {
          console.error("❌ No JSON pattern worked for content:", content);
        }
      }
    } else {
      console.warn("⚠️ No content received from OpenAI");
    }

    // Fallback responses based on question count
    if (!json) {
      console.warn("⚠️ 🔴 USING FALLBACK - No valid JSON response from OpenAI");
      console.warn("Reason: Either API failed or response couldn't be parsed as JSON");
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

    console.log("📤 Emergency911 /respond sending:", JSON.stringify(json, null, 2));
    
    return NextResponse.json({ 
      conversation: json
    });
  } catch (err) {
    console.error("❌ Emergency911 respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}