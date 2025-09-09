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

    const { userMessage, conversationHistory = [], explanationGiven = false } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    let endConversation = false;
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

    // Define simple conversation flow (one question only)
    let officerResponse = "";
    
    if (conversationHistory.length === 0) {
      // First interaction - officer approaches
      officerResponse = "Excuse me, I see you've parked in a no-parking zone and I've issued you a ticket. Would you like to explain your situation?";
    } else if (conversationHistory.length >= 2) {
      // End conversation after user's explanation
      if (newExplanationGiven) {
        officerResponse = "I understand your situation with the parking shortage. While I can't remove the ticket, I appreciate you explaining the circumstances. Please be more careful in the future and consider arriving earlier to find proper parking.";
      } else {
        officerResponse = "I understand, but unfortunately the ticket stands. Please make sure to follow parking regulations in the future. Have a good day.";
      }
      endConversation = true;
    } else {
      // Fallback
      officerResponse = "Could you please explain what happened with your parking?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "Officer Martinez",
      text: officerResponse
    };

    const response = {
      conversation: conversationResponse,
      score: userMessage ? scoreData : undefined,
      feedback: userMessage && endConversation ? { 
        feedback: scoreData.feedback, 
        score: scoreData.points, 
        maxScore: scoreData.maxPoints 
      } : undefined,
      explanationGiven: newExplanationGiven,
      endConversation: endConversation
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
