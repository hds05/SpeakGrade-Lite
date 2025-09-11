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

// Simple scoring function for easy fast food ordering
async function scoreUserResponse(userResponse: string): Promise<ScoreData> {
  const responseLength = userResponse.trim().length;
  const lowerResponse = userResponse.toLowerCase();
  
  let points = 0;
  let feedback = "";

  // Basic scoring based on response quality
  if (responseLength < 10) {
    points = 3;
    feedback = "Try to be more specific when ordering food.";
  } else if (responseLength < 30) {
    points = 6;
    feedback = "Good start! The cashier can understand your order.";
  } else {
    points = 8;
    feedback = "Great ordering! You're communicating clearly with the cashier.";
  }

  // Bonus for mentioning food items
  const foodKeywords = ["burger", "fries", "drink", "combo", "large", "medium", "small", "chicken", "beef", "soda", "water"];
  const mentionsFood = foodKeywords.some(keyword => lowerResponse.includes(keyword));
  
  if (mentionsFood) {
    points = Math.min(10, points + 2);
  }

  // Bonus for polite language
  const politeWords = ["please", "thank you", "thanks", "could i", "may i", "excuse me"];
  const isPolite = politeWords.some(word => lowerResponse.includes(word));
  
  if (isPolite) {
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
    console.log("✅ Received body in Easy Fast Food /respond:", body);

    const { userMessage, conversationHistory = [], questionNumber } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage);
      console.log("📊 Easy fast food score:", scoreData);
    }

    let workerResponse = "";
    
    if (questionNumber === 2 && userMessage) {
      // Generate AI follow-up question with personalization
      console.log("🤖 Generating personalized AI follow-up for fast food order:", userMessage);
      
      const systemPrompt = {
        role: "system",
        content: `You are Alex Johnson, a friendly fast food cashier at FastBite. 

CRITICAL REQUIREMENTS:
1. You MUST acknowledge and reference specific food items the customer just ordered
2. You MUST personalize your follow-up based on their exact order or preferences they mentioned
3. You MUST show you were actively listening by incorporating their specific order details
4. DO NOT use generic responses - tailor everything to what they specifically ordered

Examples:
- If they ordered "burger": Ask about size, combo, or specific type
- If they mentioned "combo": Ask about drink preference or fries size
- If they ordered specific items: Suggest complementary items or confirm details
- If they mentioned preferences: Reference those in your follow-up

Your response should make them think "The cashier really listened to my order!"

Keep it friendly, helpful, and efficient as a good fast food worker would. You want to complete their order satisfactorily. Limit to 1-2 sentences.`
      };

      const userPrompt = {
        role: "user", 
        content: `The customer just placed their order: "${userMessage}"

Create a follow-up question that specifically references and builds upon what they ordered. Show you were listening by incorporating their exact food items, preferences, or order details.`
      };

      try {
        workerResponse = await callOpenAI([systemPrompt, userPrompt]);
        console.log("🎯 AI generated personalized follow-up:", workerResponse);
      } catch (error) {
        console.error("❌ Error calling OpenAI:", error);
        // Fallback to a personalized random question
        const randomFollowUps = [
          "Great choice! Would you like to make that a combo with fries and a drink?",
          "Perfect! What size would you like for your order?",
          "Awesome! Any drinks to go with that?",
          "Excellent! Would you like that for here or to go?",
          "Nice selection! Anything else I can add to your order?"
        ];
        workerResponse = randomFollowUps[Math.floor(Math.random() * randomFollowUps.length)];
      }
    } else {
      // This shouldn't happen in the new flow, but fallback just in case
      workerResponse = "Great! What else can I get for you today?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "Alex Johnson",
      text: workerResponse
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
    console.error("❌ Error in Easy Fast Food /respond:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
