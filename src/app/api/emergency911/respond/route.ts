import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: string;
  content: string;
  speaker?: string;
}

interface ScoreData {
  points: number;
  maxPoints: number;
  feedback: string;
}

interface ConversationResponse {
  speaker: string;
  text: string;
}

interface RequestBody {
  transcript?: string;
  conversationHistory?: Message[];
  questionCount?: number;
  emergencyDetails?: {
    type: boolean;
    location: boolean;
    condition: boolean;
    confirmation: boolean;
  };
}

// Add this function before POST
async function callOpenAI(messages: Message[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
      max_tokens: 200,
      }),
    });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function for emergency 911 responses
async function scoreUserResponse(userMessage: string, questionContext: string, questionCount: number): Promise<ScoreData> {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or unclear" };
  }

  const scoringPrompt: Message = {
    role: "system",
    content: `You are evaluating a caller's response to a 911 dispatcher in an emergency situation.

    SCORING CRITERIA:
    - 1 point: Response provides clear, specific, and relevant emergency information
    - 0.5 points: Response is adequate but could be more specific
    - 0 points: Response is unclear, irrelevant, or doesn't help the emergency

    EVALUATION FACTORS:
    - Clarity of communication
    - Relevance to emergency situation
    - Specificity of details provided
    - Calmness under pressure
    - Cooperation with dispatcher

    EXAMPLES:
    Question: "What's your emergency?"
    - Good (1 point): "There's been a car accident on Main Street and Broadway, two cars involved"
    - Adequate (0.5 points): "Car accident, need help"
    - Poor (0 points): "I don't know, something bad happened"

    Question: "Where are you located?"
    - Good (1 point): "I'm at 123 Main Street, near the intersection with Oak Avenue"
    - Adequate (0.5 points): "Main Street"
    - Poor (0 points): "I'm not sure"

    Respond with JSON: {"points": 0, 0.5, or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt: Message = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Caller's response: "${userMessage}"
    Question number: ${questionCount}
    
    Score this response based on clarity, relevance, and helpfulness in an emergency situation.`
  };

  try {
    const response = await callOpenAI([scoringPrompt, userPrompt]);
    const scoreData = JSON.parse(response);
    return {
      points: scoreData.points || 0,
      maxPoints: 1,
      feedback: scoreData.feedback || ""
    };
  } catch {
    // Fallback scoring based on response quality
    const lowerResponse = userMessage.toLowerCase();
    
    // Simple keyword-based scoring for emergency responses
    if (lowerResponse.length > 15 && !lowerResponse.includes("i don't know") && !lowerResponse.includes("um")) {
      return { points: 1, maxPoints: 1, feedback: "Clear and helpful emergency response" };
    } else if (lowerResponse.length > 8) {
      return { points: 0.5, maxPoints: 1, feedback: "Adequate response, could be more specific" };
    } else {
      return { points: 0, maxPoints: 1, feedback: "Response needs more detail and clarity" };
    }
  }
}

// ✅ Determine which emergency details have been provided
function updateEmergencyDetails(conversationHistory: Message[], currentDetails: any): any {
  const userMessages = conversationHistory
    .filter((msg: any) => msg.role === "user")
    .map((msg: any) => msg.content.toLowerCase());
  
  const allText = userMessages.join(" ");
  
  return {
    type: currentDetails?.type || (allText.includes("accident") || allText.includes("fire") || allText.includes("medical") || allText.includes("emergency")),
    location: currentDetails?.location || (allText.includes("street") || allText.includes("avenue") || allText.includes("road") || allText.includes("address")),
    condition: currentDetails?.condition || (allText.includes("hurt") || allText.includes("bleeding") || allText.includes("conscious") || allText.includes("breathing")),
    confirmation: currentDetails?.confirmation || (allText.includes("yes") || allText.includes("okay") || allText.includes("understand") || allText.includes("stay"))
  };
}

// ✅ Your POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    console.log("✅ Received body in Emergency911 /respond:", body);

    const { transcript, conversationHistory = [], questionCount = 0, emergencyDetails = {} } = body;

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

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 1, feedback: "" };
    
    if (transcript && transcript.trim()) {
      const lastDispatcherQuestion = conversationHistory
        .filter((msg) => msg.role === "assistant")
        .pop()?.content || "initial greeting";
      
      scoreData = await scoreUserResponse(transcript, lastDispatcherQuestion, questionCount);
      console.log("📊 Emergency caller score:", scoreData);
    }

    // Update emergency details based on conversation
    const updatedEmergencyDetails = updateEmergencyDetails(conversationHistory, emergencyDetails);
    const detailsProvided = Object.values(updatedEmergencyDetails).filter(Boolean).length;

    const systemMsg: Message = {
      role: "system",
      content: `You are a 911 emergency dispatcher. Your role is to:

      ${emergencyContext}

      INSTRUCTIONS:
      - Stay calm and professional
      - Ask ONE clear question at a time
      - Get emergency type, location, and condition
      - Provide reassurance and clear instructions
      - Confirm caller understands to stay on the line
      - Current question count: ${questionCount}
      - Emergency details provided: ${detailsProvided}/4

      DISPATCHER PERSONALITY:
      - Calm and professional
      - Clear and direct communication
      - Reassuring but efficient
      - Focused on getting essential information

      TOPICS TO COVER:
      1. Emergency type (what happened)
      2. Location (where is the emergency)
      3. Condition (are people hurt, how bad)
      4. Confirmation (stay on line, help is coming)

      EXAMPLE RESPONSES:
      - "911, what's your emergency?"
      - "Can you tell me exactly where this is happening?"
      - "Are there any injuries? How many people are hurt?"
      - "Please stay on the line. Help is on the way."

      Respond with a JSON object: {"speaker":"911 Dispatcher","text":"your response"}`,
    };
    
    const userPrompt: Message = {
      role: "user",
      content: transcript
        ? `Caller said: "${transcript}". ${detailsProvided < 4 ? "Ask your next question to get more emergency details." : "Provide final instructions and reassurance."}`
        : `Start by asking what the emergency is.`,
    };
    
    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json: ConversationResponse | null = null;
    try {
      json = JSON.parse(content);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    // Fallback responses based on question count and emergency details
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "911, what's your emergency?",
        "Can you tell me exactly where this is happening?",
        "What type of emergency is this?",
        "Are there any injuries? How many people are hurt?",
        "Can you see any emergency vehicles or personnel?",
        "Please stay on the line. Help is on the way.",
        "Emergency services are responding. Stay calm and stay on the line.",
        "Help is arriving. Please stay on the line until they get there.",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "911 Dispatcher", 
        text: fallbackQuestions[questionIndex]
      };
    }

    console.log("📤 Emergency911 /respond sending:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);
    console.log("🚨 Emergency details:", updatedEmergencyDetails);

    return NextResponse.json({ 
      conversation: json,
      score: scoreData,
      emergencyDetails: updatedEmergencyDetails
    });
  } catch (err) {
    console.error("❌ Emergency911 respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
