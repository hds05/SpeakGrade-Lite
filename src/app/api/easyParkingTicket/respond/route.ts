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
  explanationGiven?: boolean;
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

// Simple scoring function for easy parking ticket (one explanation)
async function scoreUserResponse(userResponse: string): Promise<ScoreData> {
  const responseLength = userResponse.trim().length;
  const lowerResponse = userResponse.toLowerCase();
  
  let points = 0;
  let feedback = "";

  // Basic scoring
  if (responseLength < 15) {
    points = 3;
    feedback = "Try to provide more details about your parking situation.";
  } else if (responseLength < 50) {
    points = 6;
    feedback = "Good start! The officer can understand your situation.";
  } else {
    points = 8;
    feedback = "Great explanation! You're providing good details about your parking difficulty.";
  }

  // Bonus for mentioning key parking explanation elements
  const parkingKeywords = ["parking", "no spots", "couldn't find", "looking for", "15 minutes", "appointment", "busy", "full"];
  const mentionsParking = parkingKeywords.some(keyword => lowerResponse.includes(keyword));
  
  if (mentionsParking) {
    points = Math.min(10, points + 2);
    feedback = "Excellent! You clearly explained the parking situation with specific details.";
  }

  // Bonus for respectful language
  const respectfulWords = ["officer", "sir", "sorry", "understand", "apologize", "respect"];
  const isRespectful = respectfulWords.some(word => lowerResponse.includes(word));
  
  if (isRespectful) {
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
    console.log("✅ Received body in Easy Parking Ticket /respond:", body);

    const { userMessage, conversationHistory = [], explanationGiven = false, questionNumber } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    let newExplanationGiven = explanationGiven;
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage);
      console.log("📊 Easy parking ticket score:", scoreData);
      
      // Check if user provided parking explanation
      const lowerResponse = userMessage.toLowerCase();
      if (lowerResponse.includes("parking") || lowerResponse.includes("no spots") || 
          lowerResponse.includes("couldn't find") || lowerResponse.includes("looking for")) {
        newExplanationGiven = true;
      }
    }

    let officerResponse = "";
    
    if (questionNumber === 2 && userMessage) {
      // Generate AI follow-up question with STRONG personalization emphasis
      console.log("🤖 Generating personalized AI follow-up for parking explanation:", userMessage);
      
      const systemPrompt = {
        role: "system",
        content: `You are Officer Martinez, a professional parking enforcement officer. 

CRITICAL REQUIREMENTS:
1. You MUST acknowledge and reference specific details from what the person just said about their parking situation
2. You MUST personalize your follow-up based on their exact explanation, excuse, or circumstances they mentioned
3. You MUST show you were actively listening by incorporating their specific details into your response
4. DO NOT use generic responses - tailor everything to what they specifically said about their parking

Examples:
- If they mentioned "couldn't find parking": Ask about how long they looked or what they tried
- If they mentioned "emergency": Ask for more details about the emergency situation
- If they mentioned "just a few minutes": Acknowledge that timeframe specifically
- If they mentioned being "late for appointment": Reference that specific situation

Your response should make them think "The officer really listened to my explanation!"

Keep it professional but understanding, as a good officer would. You're still giving them the ticket, but you want to understand their situation. Limit to 1-2 sentences.`
      };

      const userPrompt = {
        role: "user", 
        content: `The person just explained their parking situation: "${userMessage}"

Create a follow-up question that specifically references and builds upon what they shared about their parking. Show you were listening by incorporating their exact circumstances, timing, or reasons they provided.`
      };

      try {
        officerResponse = await callOpenAI([systemPrompt, userPrompt]);
        console.log("🎯 AI generated personalized follow-up:", officerResponse);
      } catch (error) {
        console.error("❌ Error calling OpenAI:", error);
        // Fallback to a personalized random question
        const randomFollowUps = [
          "I see your situation. How long were you looking for parking before you decided to park here?",
          "That sounds challenging. Have you had parking issues in this area before?",
          "I understand your frustration. What would have been your alternative if this spot wasn't available?",
          "Thanks for explaining that. How familiar are you with the parking rules in this area?",
          "I hear you. What do you think would be a good solution for the parking shortage here?"
        ];
        officerResponse = randomFollowUps[Math.floor(Math.random() * randomFollowUps.length)];
      }
    } else {
      // This shouldn't happen in the new flow, but fallback just in case
      officerResponse = "I understand your situation. Is there anything else about your parking that you'd like to explain?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "Officer Martinez",
      text: officerResponse
    };

    const response = {
      conversation: conversationResponse,
      score: userMessage ? scoreData : undefined,
      feedback: userMessage ? { 
        feedback: scoreData.feedback, 
        score: scoreData.points, 
        maxScore: scoreData.maxPoints 
      } : undefined,
      explanationGiven: newExplanationGiven
    };

    console.log("✅ Sending response:", response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error in Easy Parking Ticket /respond:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
