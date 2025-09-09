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

    // Define the interview questions
    const questions = [
      "Hello! Welcome to your interview. I'm Sarah Johnson, and I'll be conducting this interview today. To start, could you please tell me a little bit about yourself and your background?",
      "That's great to hear! Now, what interests you most about this opportunity, and where do you see yourself in the future?"
    ];

    let interviewerResponse = "";
    
    if (questionNumber === 1 || conversationHistory.length === 0) {
      // First question
      interviewerResponse = questions[0];
    } else if (questionNumber === 2 || conversationHistory.length === 2) {
      // Second question with acknowledgment of first answer
      interviewerResponse = `Thank you for sharing that with me. ${questions[1]}`;
    } else if (conversationHistory.length >= 4) {
      // End of interview
      interviewerResponse = "Thank you so much for your time today. You did a wonderful job answering our questions. We'll be in touch soon!";
    } else {
      // Fallback for first question
      interviewerResponse = questions[0];
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
