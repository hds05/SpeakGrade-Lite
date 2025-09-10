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
  questionNumber?: number;
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

// Simple scoring function for easy weekly manager check
async function scoreUserResponse(userResponse: string, conversationLength: number): Promise<ScoreData> {
  const responseLength = userResponse.trim().length;
  const wordCount = userResponse.trim().split(/\s+/).length;
  
  let points = 0;
  let feedback = "";

  if (responseLength < 10) {
    points = 2;
    feedback = "Try to share a bit more about your week for better communication.";
  } else if (responseLength < 50) {
    points = 5;
    feedback = "Good start! Your manager appreciates the update.";
  } else if (responseLength < 100) {
    points = 8;
    feedback = "Great communication! You're sharing the right amount of detail.";
  } else {
    points = 10;
    feedback = "Excellent! Your detailed update shows great workplace communication skills.";
  }

  // Bonus for positive workplace language
  const positiveWords = ["good", "great", "progress", "completed", "working", "team", "productive"];
  const hasPositiveLanguage = positiveWords.some(word => 
    userResponse.toLowerCase().includes(word)
  );
  
  if (hasPositiveLanguage) {
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
    console.log("✅ Received body in Easy Weekly Manager /respond:", body);

    const { userMessage, conversationHistory = [], questionNumber } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage, conversationHistory.length);
      console.log("📊 Easy weekly manager score:", scoreData);
    }

    let managerResponse = "";
    
    if (questionNumber === 2 && userMessage) {
      // Generate AI follow-up question with STRONG personalization emphasis
      console.log("🤖 Generating personalized AI follow-up for weekly update:", userMessage);
      
      const systemPrompt = {
        role: "system",
        content: `You are David Chen, a supportive team manager conducting a weekly check-in. 

CRITICAL REQUIREMENTS:
1. You MUST acknowledge and reference specific details from what the employee just shared about their week
2. You MUST personalize your follow-up question based on their exact work, projects, or challenges they mentioned
3. You MUST show you were actively listening by incorporating their specific details into your response
4. DO NOT use generic questions - tailor everything to what they specifically said about their work

Examples:
- If they mentioned "marketing campaign": Ask about specific results or challenges with that campaign
- If they mentioned "client meetings": Ask about how those went or what came out of them
- If they mentioned "debugging issues": Ask about their progress or what they learned
- If they mentioned working with specific team members: Reference those collaborations

Your response should make the employee think "My manager really listened to my update!"

Keep it supportive, professional, and encouraging as a good manager would. Limit to 1-2 sentences.`
      };

      const userPrompt = {
        role: "user", 
        content: `The employee just gave their weekly update: "${userMessage}"

Create a follow-up question that specifically references and builds upon what they shared about their work this week. Show you were listening by incorporating their exact projects, tasks, challenges, or accomplishments.`
      };

      try {
        managerResponse = await callOpenAI([systemPrompt, userPrompt]);
        console.log("🎯 AI generated personalized follow-up:", managerResponse);
      } catch (error) {
        console.error("❌ Error calling OpenAI:", error);
        // Fallback to a personalized random question
        const randomFollowUps = [
          "That sounds like productive work! What's been the most challenging part so far?",
          "Great progress! Is there anything you need support with to keep things moving?",
          "Interesting update! What are you most excited about tackling next week?",
          "Thanks for sharing that! How are you feeling about the workload overall?",
          "Good to hear! What would help you be even more effective going forward?"
        ];
        managerResponse = randomFollowUps[Math.floor(Math.random() * randomFollowUps.length)];
      }
    } else {
      // This shouldn't happen in the new flow, but fallback just in case
      managerResponse = "Thanks for the update! Is there anything else you'd like to discuss about your work this week?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "David Chen",
      text: managerResponse
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
    console.error("❌ Error in Easy Weekly Manager /respond:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
