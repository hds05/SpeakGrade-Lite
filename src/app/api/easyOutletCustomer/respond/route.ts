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
  hatReturned?: boolean;
}

// Simple scoring function for easy outlet customer (hat return)
async function scoreUserResponse(userResponse: string, conversationLength: number): Promise<ScoreData> {
  const responseLength = userResponse.trim().length;
  const lowerResponse = userResponse.toLowerCase();
  
  let points = 0;
  let feedback = "";

  // Basic scoring
  if (responseLength < 10) {
    points = 2;
    feedback = "Try to provide more details about your return request.";
  } else if (responseLength < 30) {
    points = 5;
    feedback = "Good start! The cashier understands your request.";
  } else {
    points = 8;
    feedback = "Great communication! You're providing clear details.";
  }

  // Bonus for mentioning key return elements
  const returnKeywords = ["return", "hat", "doesn't fit", "exchange", "receipt", "yesterday", "too small", "too big"];
  const mentionsReturn = returnKeywords.some(keyword => lowerResponse.includes(keyword));
  
  if (mentionsReturn) {
    points = Math.min(10, points + 2);
    feedback = "Excellent! You clearly explained your return request with specific details.";
  }

  // Bonus for polite language
  const politeWords = ["please", "thank you", "excuse me", "could you", "would you"];
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
    console.log("✅ Received body in Easy Outlet Customer /respond:", body);

    const { userMessage, conversationHistory = [], hatReturned = false } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    let endConversation = false;
    let newHatReturned = hatReturned;
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage, conversationHistory.length);
      console.log("📊 Easy outlet customer score:", scoreData);
      
      // Check if user mentioned return/hat - mark as returned
      const lowerResponse = userMessage.toLowerCase();
      if (lowerResponse.includes("return") || lowerResponse.includes("hat") || 
          lowerResponse.includes("exchange") || lowerResponse.includes("doesn't fit")) {
        newHatReturned = true;
      }
    }

    // Define simple conversation flow
    let cashierResponse = "";
    
    if (conversationHistory.length === 0) {
      // First interaction - greeting
      cashierResponse = "Hi there! Welcome to Fashion Outlet. How can I help you today?";
    } else if (conversationHistory.length === 2 && !newHatReturned) {
      // User hasn't mentioned return yet
      cashierResponse = "I'd be happy to help you with that. Could you tell me more about what you need?";
    } else if (conversationHistory.length >= 2 && newHatReturned && conversationHistory.length < 4) {
      // User mentioned return, process it
      cashierResponse = "Of course! I can help you with that hat return. Do you have your receipt with you? Since it was purchased yesterday, that's within our return policy.";
    } else if (conversationHistory.length >= 4 && newHatReturned) {
      // Complete the return
      cashierResponse = "Perfect! I've processed your return. Here's your refund. Thank you for shopping with us, and I hope you find something that fits better next time!";
      endConversation = true;
    } else {
      // Fallback
      cashierResponse = "Is there anything else I can help you with today?";
      if (conversationHistory.length >= 6) {
        endConversation = true;
      }
    }

    const conversationResponse: ConversationResponse = {
      speaker: "Emma Rodriguez",
      text: cashierResponse
    };

    const response = {
      conversation: conversationResponse,
      score: userMessage ? scoreData : undefined,
      feedback: userMessage && endConversation ? { 
        feedback: scoreData.feedback, 
        score: scoreData.points, 
        maxScore: scoreData.maxPoints 
      } : undefined,
      hatReturned: newHatReturned,
      endConversation: endConversation
    };

    console.log("✅ Sending response:", response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error in Easy Outlet Customer /respond:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
