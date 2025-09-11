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
  userMessage?: string;
  conversationHistory?: Message[];
  questionNumber: number;
}

// Simple OpenAI call function
async function callOpenAI(messages: Message[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      })),
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

// Simple scoring function for basic interview
async function scoreUserResponse(userResponse: string, questionNumber: number): Promise<ScoreData> {
  // Simple scoring based on response length and basic criteria
  const responseLength = userResponse.trim().length;
  const wordCount = userResponse.trim().split(/\s+/).length;
  
  let points = 0;
  let feedback = "";

  if (responseLength < 20) {
    points = 2;
    feedback = "Try to provide more detailed answers to show your communication skills.";
  } else if (responseLength < 100) {
    points = 5;
    feedback = "Good start! Consider adding more examples or details to strengthen your answers.";
  } else if (responseLength < 200) {
    points = 8;
    feedback = "Great response! You provided good detail and showed clear communication.";
  } else {
    points = 10;
    feedback = "Excellent! Your detailed response demonstrates strong communication skills.";
  }

  // Bonus points for question-specific criteria
  if (questionNumber === 1 && userResponse.toLowerCase().includes("experience")) {
    points = Math.min(10, points + 1);
  }
  if (questionNumber === 2 && (userResponse.toLowerCase().includes("goal") || userResponse.toLowerCase().includes("future"))) {
    points = Math.min(10, points + 1);
  }

  return {
    points,
    maxPoints: 10,
    feedback
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    console.log("✅ Received body in Basic Interview Room /respond:", body);

    const { userMessage, conversationHistory = [], questionNumber } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage, questionNumber);
      console.log("📊 Basic interview score:", scoreData);
    }

    let interviewerResponse = "";
    
    if (questionNumber === 2 && userMessage) {
      // Generate AI follow-up question with STRONG personalization emphasis
      console.log("🤖 Generating personalized AI follow-up for:", userMessage);
      
      const systemPrompt = {
        role: "system",
        content: `You are Sarah Johnson, a friendly HR manager conducting a basic interview. 

CRITICAL REQUIREMENTS:
1. You MUST acknowledge and reference specific details from what the candidate just shared
2. You MUST personalize your follow-up question based on their exact words, experience, or industry they mentioned
3. You MUST show you were actively listening by incorporating their specific details into your response
4. DO NOT use generic questions - tailor everything to what they specifically said

Examples:
- If they mentioned "marketing": Ask about specific campaigns or marketing challenges
- If they mentioned "5 years experience": Reference that timeframe in your question  
- If they mentioned a specific company/role: Ask about that experience
- If they mentioned skills: Ask to elaborate on those specific skills

Your response should make the candidate think "Wow, she really listened to what I said!"

Keep it conversational, professional, and encouraging. Limit to 1-2 sentences.`
      };

      const userPrompt = {
        role: "user", 
        content: `The candidate just introduced themselves by saying: "${userMessage}"

Create a follow-up question that specifically references and builds upon what they shared. Make it clear you were listening by incorporating their exact details, experience level, industry, or specific information they provided.`
      };

      try {
        interviewerResponse = await callOpenAI([systemPrompt, userPrompt]);
        console.log("🎯 AI generated personalized follow-up:", interviewerResponse);
      } catch (error) {
        console.error("❌ Error calling OpenAI:", error);
        // Fallback to a personalized random question
        const randomFollowUps = [
          `That's fascinating! Based on what you shared, what's been the most rewarding part of your journey?`,
          `Interesting background! What drew you specifically to that field in the first place?`,
          `Great experience! What's one thing you wish you'd known when you first started?`,
          `That's impressive! What keeps you motivated in your current role?`,
          `Wonderful! What would you say has been your biggest professional growth moment?`
        ];
        interviewerResponse = randomFollowUps[Math.floor(Math.random() * randomFollowUps.length)];
      }
    } else {
      // This shouldn't happen in the new flow, but fallback just in case
      interviewerResponse = "Thank you for sharing that with me. Can you tell me more about your experience?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "Sarah Johnson",
      text: interviewerResponse
    };

    const response = {
      conversation: conversationResponse,
      score: userMessage ? scoreData : undefined,
      feedback: userMessage ? { 
        feedback: scoreData.feedback, 
        score: scoreData.points, 
        maxScore: scoreData.maxPoints 
      } : undefined
    };

    console.log("✅ Sending response:", response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error in Basic Interview Room /respond:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
