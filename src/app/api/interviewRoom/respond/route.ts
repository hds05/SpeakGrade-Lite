import { NextRequest, NextResponse } from "next/server";
import { debugLog, debugWarn } from "@/lib/debugLog";

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

// ✅ Enhanced scoring function for interview responses
async function scoreUserResponse(userMessage: string, questionContext: string, questionCount: number): Promise<ScoreData> {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or unclear" };
  }

  const scoringPrompt: Message = {
    role: "system",
    content: `You are evaluating a job candidate's response in a professional interview.

    SCORING CRITERIA:
    - 1 point: Clear, professional, and relevant response with specific details
    - 0.5 points: Adequate response but could be more detailed or specific
    - 0 points: Unclear, unprofessional, or irrelevant response

    EVALUATION FACTORS:
    - Clarity of communication
    - Professionalism and tone
    - Relevance to the question asked
    - Specificity of examples or details provided
    - Confidence and composure
    - Appropriate length for the question

    EXAMPLES:
    Question: "Tell us about yourself"
    - Good (1 point): "I'm a marketing professional with 5 years of experience in digital advertising, specializing in social media campaigns and data analytics. I've worked with brands like Nike and Coca-Cola, helping them increase their online engagement by 40%."
    - Adequate (0.5 points): "I work in marketing and have some experience with social media."
    - Poor (0 points): "I don't know, I just work there"

    Question: "What are your strengths?"
    - Good (1 point): "My key strengths are analytical thinking and teamwork. I love diving deep into data to find insights, and I've successfully led cross-functional teams on three major projects."
    - Adequate (0.5 points): "I'm good at working with people and solving problems."
    - Poor (0 points): "I'm good at stuff"

    Respond with JSON: {"points": 0, 0.5, or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt: Message = {
    role: "user",
    content: `Previous question: "${questionContext}"
    Candidate's response: "${userMessage}"
    Question number: ${questionCount}
    
    Score this response based on clarity, professionalism, relevance, and specificity.`
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
    
    // Enhanced keyword-based scoring for interview responses
    if (lowerResponse.length > 25 && !lowerResponse.includes("i don't know") && !lowerResponse.includes("um") && !lowerResponse.includes("uh")) {
      return { points: 1, maxPoints: 1, feedback: "Clear, detailed, and professional response" };
    } else if (lowerResponse.length > 15 && !lowerResponse.includes("i don't know")) {
      return { points: 0.5, maxPoints: 1, feedback: "Adequate response, could be more detailed" };
    } else {
      return { points: 0, maxPoints: 1, feedback: "Response needs more detail and clarity" };
    }
  }
}

// ✅ Enhanced feedback generation function
async function generateFeedback(conversationHistory: Message[], questionCount: number, totalScore: number, maxScore: number): Promise<{ feedback: string; score: number; maxScore: number }> {
  const systemPrompt = `You are an expert interview evaluator. Analyze the conversation and provide:
1. Constructive feedback on communication skills
2. A score out of 10 for overall performance
3. Specific areas for improvement
4. Positive reinforcement for strengths

Consider: clarity, professionalism, response quality, confidence, and overall interview presence.`;

  const conversationText = conversationHistory
    .map(msg => `${msg.speaker || msg.role}: ${msg.content}`)
    .join('\n');

  const userPrompt = `Analyze this interview conversation and provide feedback in JSON format:
{"feedback": "Your detailed feedback here", "score": 8, "maxScore": 10}

Conversation:
${conversationText}

Interview Statistics:
- Questions answered: ${questionCount}
- Performance score: ${totalScore}/${maxScore}
- Accuracy: ${maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%

Provide constructive, professional feedback that encourages improvement while recognizing strengths.`;

  try {
    const response = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const parsed = JSON.parse(response);
    return {
      feedback: parsed.feedback || "Good communication skills demonstrated. Continue practicing for improvement.",
      score: parsed.score || Math.max(5, Math.round((totalScore / maxScore) * 10)),
      maxScore: parsed.maxScore || 10
    };
  } catch {
    // Fallback feedback based on performance
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    let feedback = "";
    
    if (percentage >= 80) {
      feedback = "Excellent interview performance! Your communication skills are strong and professional.";
    } else if (percentage >= 60) {
      feedback = "Good interview performance. You demonstrated solid communication skills with room for improvement.";
    } else if (percentage >= 40) {
      feedback = "Fair interview performance. Focus on providing more detailed and specific responses.";
    } else {
      feedback = "Interview performance needs improvement. Practice giving clearer, more detailed responses.";
    }
    
    return {
      feedback: feedback,
      score: Math.max(5, Math.round((totalScore / maxScore) * 10)),
      maxScore: 10
    };
  }
}

// ✅ Your POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    debugLog("✅ InterviewRoom /respond received:", {
      userMessageLen: body.userMessage?.length ?? 0,
      historyLen: body.conversationHistory?.length ?? 0,
      currentSpeaker: body.currentSpeaker,
      timeLeft: body.timeLeft,
      questionCount: body.questionCount ?? 0,
    });

    const { userMessage, conversationHistory = [], currentSpeaker, timeLeft = 30, questionCount = 0 } = body;
    const trimmedHistory =
      conversationHistory.length > 14
        ? conversationHistory.slice(-14)
        : conversationHistory;

    // Score user's response if they provided one
    let scoreData: ScoreData = { points: 0, maxPoints: 1, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      const lastInterviewerQuestion = conversationHistory
        .filter((msg) => msg.role === "assistant")
        .pop()?.content || "initial question";
      
      scoreData = await scoreUserResponse(userMessage, lastInterviewerQuestion, questionCount);
      debugLog("📊 Interview score:", scoreData.points);
    }

    const systemMsg: Message = {
      role: "system",
      content: `You are acting as ${currentSpeaker}, an interviewer in a panel interview.
    You will ask exactly ONE question or give a short comment (max 2 sentences) to the candidate.
    Do not answer for other interviewers. Only speak as "${currentSpeaker}". 
    
    INTERVIEWER PERSONALITY:
    - Professional and engaging
    - Ask clear, relevant questions
    - Show interest in the candidate's responses
    - Maintain a professional but friendly tone
    
    Output a JSON object like: {"speaker":"${currentSpeaker}","text":"..."}`,
    };
    
    const userPrompt: Message = {
      role: "user",
      content: userMessage
        ? `The candidate just answered: "${userMessage}". Now ask your next question.`
        : `Start the interview by greeting the candidate and asking your first question.`,
    };
    
    const content = await callOpenAI([systemMsg, ...trimmedHistory, userPrompt]);
    debugLog("🧠 GPT raw response length:", content.length);

    let json: ConversationResponse | null = null;
    try {
      json = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    if (!json) {
      debugWarn("⚠️ GPT response not JSON. Falling back.");
      const fallbackQuestions = [
        "Hello and welcome to your interview. Can you please tell us about yourself?",
        "Thanks — can you tell me more about your background?",
        "What interests you about this position?",
        "Can you describe a challenging project you worked on?",
        "How do you handle working under pressure?",
        "What are your career goals for the next few years?",
        "Do you have any questions for us?",
        "Thank you for your time today. We'll be in touch soon.",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = {
        speaker: currentSpeaker,
        text: fallbackQuestions[questionIndex],
      };
    }

    // Generate feedback if this is the last question or time is running low
    let feedback = null;
    if (timeLeft <= 5 || questionCount >= 6) {
      try {
        // Calculate current totals for feedback
        const currentScore = conversationHistory
          .filter((msg) => msg.role === "user")
          .length * scoreData.points; // Simplified calculation
        const currentMaxScore = Math.max(1, questionCount);
        
        feedback = await generateFeedback(conversationHistory, questionCount, currentScore, currentMaxScore);
        debugLog("📊 Generated feedback");
      } catch (error) {
        debugWarn("⚠️ Failed to generate feedback:", error);
      }
    }

    debugLog("📤 InterviewRoom sending:", {
      speaker: json.speaker,
      textLen: json.text.length,
      hasFeedback: !!feedback,
    });

       // Calculate progress based on question count and time
       const totalQuestions = 8; // Total questions in the scenario
       const currentProgress = Math.min(questionCount, totalQuestions);
       const overallProgress = Math.round((currentProgress / totalQuestions) * 100);
       
       debugLog(`📈 Progress: ${currentProgress}/${totalQuestions} (${overallProgress}%)`);
   
       return NextResponse.json({ 
         conversation: json,
         feedback: feedback,
         score: scoreData,
         progress: {
           current: currentProgress,
           total: totalQuestions,
           percentage: overallProgress
         }
       });
  } catch (err) {
    console.error("❌ respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
