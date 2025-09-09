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

    const { userMessage, conversationHistory = [] } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 10, feedback: "" };
    let endConversation = false;
    
    if (userMessage && userMessage.trim()) {
      scoreData = await scoreUserResponse(userMessage, conversationHistory.length);
      console.log("📊 Easy weekly manager score:", scoreData);
    }

    // Define simple conversation flow
    let managerResponse = "";
    
    if (conversationHistory.length === 0) {
      // First interaction - greeting
      managerResponse = "Hi there! Good to see you for our weekly check-in. How has your week been going so far?";
    } else if (conversationHistory.length === 2) {
      // Second interaction - follow up
      managerResponse = "That sounds good! Is there anything you need help with or any challenges you're facing that I should know about?";
    } else if (conversationHistory.length >= 4) {
      // End conversation
      managerResponse = "Thanks for the update! Keep up the good work, and let me know if you need anything. Have a great rest of your week!";
      endConversation = true;
    } else {
      // Fallback response
      managerResponse = "I appreciate you sharing that with me. Anything else on your mind for this week?";
    }

    const conversationResponse: ConversationResponse = {
      speaker: "David Chen",
      text: managerResponse
    };

    const response = {
      conversation: conversationResponse,
      score: userMessage ? scoreData : undefined,
      feedback: userMessage && endConversation ? { 
        feedback: scoreData.feedback, 
        score: scoreData.points, 
        maxScore: scoreData.maxPoints 
      } : undefined,
      endConversation: endConversation
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
