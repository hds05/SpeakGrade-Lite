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
  currentSpeaker: string;
  timeLeft?: number;
  questionCount?: number;
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
      messages: messages,
      temperature: 0.6,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function for interview responses
async function scoreUserResponse(userMessage: string, questionContext: string, timeLeft: number): Promise<ScoreData> {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or unclear" };
  }

  const scoringPrompt: Message = {
    role: "system",
    content: `You are evaluating a job candidate's response in a professional interview.

    SCORING CRITERIA:
    - 1 point: Clear, professional, and relevant response
    - 0.5 points: Adequate but could be improved
    - 0 points: Unclear, unprofessional, or irrelevant

    EVALUATION FACTORS:
    - Clarity of communication
    - Professionalism
    - Relevance to question
    - Confidence level
    - Time management (if time is running low)

    EXAMPLES:
    Question: "Tell us about yourself"
    - Good (1 point): "I'm a marketing professional with 5 years of experience in digital advertising..."
    - Adequate (0.5 points): "I work in marketing and like my job"
    - Poor (0 points): "I don't know, I just work there"

    Respond with JSON: {"points": 0, 0.5, or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt: Message = {
    role: "user",
    content: `Previous question: "${questionContext}"
    Candidate's response: "${userMessage}"
    Time remaining: ${timeLeft} seconds
    
    Score this response based on clarity, professionalism, and relevance.`
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
    
    // Simple keyword-based scoring
    if (lowerResponse.length > 20 && !lowerResponse.includes("i don't know") && !lowerResponse.includes("um")) {
      return { points: 1, maxPoints: 1, feedback: "Clear and professional response" };
    } else if (lowerResponse.length > 10) {
      return { points: 0.5, maxPoints: 1, feedback: "Adequate response, could be more detailed" };
    } else {
      return { points: 0, maxPoints: 1, feedback: "Response needs more detail and clarity" };
    }
  }
}

// Function to generate feedback and scoring
async function generateFeedback(conversationHistory: Message[], timeLeft: number): Promise<{ feedback: string; score: number; maxScore: number }> {
  const systemPrompt = `You are an expert interview evaluator. Analyze the conversation and provide:
1. Constructive feedback on communication skills
2. A score out of 10 for overall performance
3. Specific areas for improvement

Consider: clarity, professionalism, response quality, and time management.`;

  const conversationText = conversationHistory
    .map(msg => `${msg.speaker || msg.role}: ${msg.content}`)
    .join('\n');

  const userPrompt = `Analyze this interview conversation and provide feedback in JSON format:
{"feedback": "Your detailed feedback here", "score": 8, "maxScore": 10}

Conversation:
${conversationText}

Time remaining: ${timeLeft} seconds

Provide constructive, professional feedback.`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  try {
    const parsed = JSON.parse(response);
    return {
      feedback: parsed.feedback || "Good communication skills demonstrated.",
      score: parsed.score || 7,
      maxScore: parsed.maxScore || 10
    };
  } catch {
    return {
      feedback: "Good communication skills demonstrated. Continue practicing for improvement.",
      score: 7,
      maxScore: 10
    };
  }
}

// Your POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    console.log("✅ Received body in Interview Room /respond:", body);

    const { userMessage, conversationHistory = [], currentSpeaker, timeLeft = 30, questionCount = 0 } = body;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 1, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      const lastInterviewerQuestion = conversationHistory
        .filter((msg) => msg.role === "assistant")
        .pop()?.content || "initial question";
      
      scoreData = await scoreUserResponse(userMessage, lastInterviewerQuestion, timeLeft);
      console.log("📊 Interview score:", scoreData);
    }

    const systemMsg: Message = {
      role: "system",
      content: `You are acting as ${currentSpeaker}, an interviewer in a panel interview.
    You will ask exactly ONE question or give a short comment (max 2 sentences) to the candidate.
    Do not answer for other interviewers. Only speak as "${currentSpeaker}". Output a JSON object like: {"speaker":"${currentSpeaker}","text":"..."}`,
    };
    
    const userPrompt: Message = {
      role: "user",
      content: userMessage
        ? `The candidate just answered: "${userMessage}". Now ask your next question.`
        : `Start the interview by greeting the candidate and asking your first question.`,
    };
    
    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json: ConversationResponse | null = null;
    try {
      json = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    if (!json) {
      console.warn("⚠️ GPT response not JSON. Falling back.");
      json = {
        speaker: "Bob",
        text: "Thanks — can you tell me more about your background?",
      };
    }

    // Generate feedback if this is the last question or time is running low
    let feedback = null;
    if (timeLeft <= 5 || conversationHistory.length >= 8) {
      try {
        feedback = await generateFeedback(conversationHistory, timeLeft);
        console.log("📊 Generated feedback:", feedback);
      } catch (error) {
        console.warn("⚠️ Failed to generate feedback:", error);
      }
    }

    console.log("📤 Interview Room /respond sending:", JSON.stringify({ conversation: json, feedback, score: scoreData }, null, 2));
    console.log("📊 Score data:", scoreData);

    return NextResponse.json({ 
      conversation: json,
      feedback: feedback,
      score: scoreData
    });
  } catch (err) {
    console.error("❌ respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
