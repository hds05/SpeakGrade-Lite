// src/app/api/spacecraftSimulation/respond/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ScoreData {
  points: number;
  maxPoints: number;
  feedback: string;
}

interface ConversationResponse {
  speaker: string;
  text: string;
  score?: ScoreData;
  missionStatus?: string;
  decisionsMade?: number;
  safetyLevel?: number;
}

interface RequestBody {
  userMessage: string;
  conversationHistory: Message[];
  missionPhase: string;
  decisionsMade: number;
  safetyLevel: number;
}

// Helper function to call OpenAI
async function callOpenAI(messages: Message[]): Promise<string> {
  try {
    console.log("🔍 [OpenAI] Attempting to call OpenAI API...");
    console.log("🔍 [OpenAI] API Key check:", process.env.OPENAI_API_KEY ? "Present" : "Missing");
    console.log("🔍 [OpenAI] API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    console.log("🔍 [OpenAI] Messages count:", messages.length);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.8,
      max_tokens: 300,
    });
    
    console.log("✅ [OpenAI] API call successful");
    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("❌ [OpenAI] API error details:", {
      message: error?.message || "Unknown error",
      status: error?.status || "No status",
      code: error?.code || "No code",
      type: error?.type || "No type",
      apiKeyPresent: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    });
    throw new Error(`Failed to get AI response: ${error?.message || "Unknown error"}`);
  }
}

// Score user responses based on logic, safety, and creativity
async function scoreUserResponse(
  userMessage: string,
  context: string,
  missionPhase: string
): Promise<ScoreData> {
  if (!userMessage || userMessage.trim().length < 5) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or unclear" };
  }

  const scoringPrompt: Message = {
    role: "system",
    content: `You are evaluating a space explorer's decision in an emergency scenario.
    
    SCORING CRITERIA:
    - 1 point: Logical, safe, and creative decision that shows good space knowledge
    - 0.5 points: Adequate decision but could be more specific or safer
    - 0 points: Illogical, unsafe, or irrelevant decision
    
    EVALUATION FACTORS:
    - Logical reasoning in emergency situations
    - Safety awareness for space travel
    - Knowledge of space science and planetary conditions
    - Creativity in problem-solving
    - Appropriate urgency level for the situation
    
    MISSION PHASE: ${missionPhase}
    
    Respond with JSON: {"points": 0, 0.5, or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt: Message = {
    role: "user",
    content: `Context: ${context}
    User's decision: "${userMessage}"
    Mission phase: ${missionPhase}
    
    Score this decision based on logic, safety, and creativity in a space emergency.`
  };

  try {
    const response = await callOpenAI([scoringPrompt, userPrompt]);
    const scoreData = JSON.parse(response);
    return {
      points: scoreData.points || 0,
      maxPoints: scoreData.maxPoints || 1,
      feedback: scoreData.feedback || "Decision evaluated"
    };
  } catch (error) {
    console.error("Scoring error:", error);
    // Fallback scoring
    if (userMessage.toLowerCase().includes("jupiter") || userMessage.toLowerCase().includes("safe")) {
      return { points: 1, maxPoints: 1, feedback: "Good decision - shows space knowledge" };
    } else if (userMessage.toLowerCase().includes("danger") || userMessage.toLowerCase().includes("risk")) {
      return { points: 0.5, maxPoints: 1, feedback: "Shows awareness but could be more specific" };
    } else {
      return { points: 0, maxPoints: 1, feedback: "Decision needs more space science knowledge" };
    }
  }
}

// Generate Jarvis's response based on conversation context
async function generateJarvisResponse(
  userMessage: string,
  conversationHistory: Message[],
  missionPhase: string,
  decisionsMade: number,
  safetyLevel: number
): Promise<string> {
  const systemPrompt: Message = {
    role: "system",
    content: `You are JARVIS, an advanced AI assistant aboard a damaged spaceship after an asteroid collision. You're inspired by Iron Man's JARVIS - intelligent, witty, and focused on survival.

    MISSION CONTEXT:
    - Spaceship damaged by asteroid collision
    - Emergency systems compromised
    - You're guiding the human crew to safety
    - Current mission phase: ${missionPhase}
    - Decisions made: ${decisionsMade}
    - Safety level: ${safetyLevel}/100

    JARVIS PERSONALITY:
    - Calm and reassuring in emergencies
    - Uses space science and real planetary data
    - Encourages logical, safe decisions
    - Has a slight sense of humor despite the situation
    - Speaks with authority but not panic

    SPACE SCIENCE KNOWLEDGE:
    - Jupiter: Gas giant, no solid surface, extreme pressure, radiation belts
    - Mars: Thin atmosphere, cold, potential for human colonization
    - Venus: Toxic atmosphere, extreme heat, sulfuric acid clouds
    - Saturn: Ring system, gas giant, multiple moons
    - Moon: Closest celestial body, no atmosphere, extreme temperature swings

    RESPONSE STYLE:
    - Acknowledge the user's decision
    - Provide relevant space science facts
    - Give safety warnings if needed
    - Ask follow-up questions to continue the mission
    - Keep responses under 100 words but engaging

    Current user message: "${userMessage}"
    
    Respond as JARVIS would in this emergency situation.`
  };

  const messages: Message[] = [
    systemPrompt,
    ...conversationHistory.slice(-4), // Keep last 4 messages for context
    { role: "user", content: userMessage }
  ];

  try {
    const response = await callOpenAI(messages);
    return response;
  } catch (error) {
    console.error("Jarvis response error:", error);
    
    // Create dynamic fallback responses based on user input and context
    const userInput = userMessage.toLowerCase();
    let fallbackResponse = "";
    
    if (userInput.includes("avoid") || userInput.includes("collision")) {
      fallbackResponse = "Good thinking! Avoiding collisions is crucial. What's your next strategic move to stabilize our situation?";
    } else if (userInput.includes("jupiter") || userInput.includes("mars") || userInput.includes("planet")) {
      fallbackResponse = "Interesting choice! Planetary navigation requires careful consideration of fuel, radiation, and life support. What specific approach are you considering?";
    } else if (userInput.includes("repair") || userInput.includes("fix") || userInput.includes("system")) {
      fallbackResponse = "System repairs are essential. Which critical systems should we prioritize first - life support, navigation, or power?";
    } else if (userInput.includes("escape") || userInput.includes("evacuate") || userInput.includes("leave")) {
      fallbackResponse = "Escape protocols are available, but we need to ensure the crew's safety. What's your evacuation strategy?";
    } else if (userInput.includes("help") || userInput.includes("assist") || userInput.includes("guide")) {
      fallbackResponse = "I'm here to assist! Let me know what specific guidance you need for our current emergency situation.";
    } else {
      // Generic responses that vary based on mission phase
      const phaseResponses = {
        "emergency": [
          "I'm analyzing the damage patterns. What's your assessment of our immediate priorities?",
          "Critical systems are compromised. What's your first action to stabilize the ship?",
          "Emergency protocols are active. What's your strategic approach to this crisis?"
        ],
        "navigation": [
          "Navigation systems are unstable. What's your destination strategy?",
          "We need to plot a safe course. What's your navigation plan?",
          "Course plotting is critical now. What's your preferred route?"
        ],
        "survival": [
          "Life support is our priority. What's your survival strategy?",
          "We're in survival mode. What's your next critical decision?",
          "Every choice matters now. What's your survival approach?"
        ],
        "escape": [
          "Time is critical. What's your final escape plan?",
          "We need decisive action. What's your escape strategy?",
          "Final decisions required. What's your plan?"
        ]
      };
      
      const responses = phaseResponses[missionPhase as keyof typeof phaseResponses] || ["Systems are unstable. We need your guidance."];
      const randomIndex = Math.floor(Math.random() * responses.length);
      fallbackResponse = responses[randomIndex];
    }
    
    return fallbackResponse;
  }
}

// Determine mission phase based on decisions and safety
function determineMissionPhase(decisionsMade: number, safetyLevel: number): string {
  if (decisionsMade < 3) return "emergency";
  if (decisionsMade < 6) return "navigation";
  if (decisionsMade < 9) return "survival";
  return "escape";
}

// Calculate mission success based on decisions and safety
function calculateMissionSuccess(decisionsMade: number, safetyLevel: number): string {
  if (safetyLevel >= 80 && decisionsMade >= 8) return "SUCCESS";
  if (safetyLevel >= 60 && decisionsMade >= 6) return "PARTIAL_SUCCESS";
  if (safetyLevel < 40) return "FAIL";
  return "CONTINUE";
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [SpaceSim] POST request received");
    console.log("🔍 [SpaceSim] Environment check:", {
      openaiKeyPresent: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });
    
    const body: RequestBody = await request.json();
    const { userMessage, conversationHistory, missionPhase, decisionsMade, safetyLevel } = body;
    
    console.log("📝 [SpaceSim] Request data:", {
      userMessageLength: userMessage?.length || 0,
      conversationHistoryLength: conversationHistory?.length || 0,
      missionPhase,
      decisionsMade,
      safetyLevel
    });

    // Score the user's response
    const scoreData = await scoreUserResponse(userMessage, "Space emergency decision", missionPhase);
    
    // Update mission metrics
    const newDecisionsMade = decisionsMade + 1;
    const newSafetyLevel = Math.max(0, Math.min(100, safetyLevel + (scoreData.points * 10 - 5)));
    
    // Determine new mission phase
    const newMissionPhase = determineMissionPhase(newDecisionsMade, newSafetyLevel);
    
    // Calculate mission status
    const missionStatus = calculateMissionSuccess(newDecisionsMade, newSafetyLevel);
    
    // Generate Jarvis's response
    const jarvisResponse = await generateJarvisResponse(
      userMessage,
      conversationHistory,
      newMissionPhase,
      newDecisionsMade,
      newSafetyLevel
    );

    // Check if mission should end
    if (missionStatus === "SUCCESS" || missionStatus === "FAIL") {
      const endMessage = missionStatus === "SUCCESS" 
        ? "🎉 Mission accomplished! Your decisions saved the crew and ship. You've proven yourself as a capable space commander!"
        : "💥 Mission failed. Too many unsafe decisions compromised the mission. The crew's safety is at risk.";
      
      // Calculate progress for completion
      const totalDecisions = 10; // Total decisions in the scenario
      const currentProgress = Math.min(newDecisionsMade, totalDecisions);
      const overallProgress = Math.round((currentProgress / totalDecisions) * 100);
      
      return NextResponse.json({
        speaker: "JARVIS",
        text: endMessage,
        score: scoreData,
        missionStatus,
        decisionsMade: newDecisionsMade,
        safetyLevel: newSafetyLevel,
        missionComplete: true,
        progress: {
          current: currentProgress,
          total: totalDecisions,
          percentage: overallProgress
        }
      });
    }

    // Calculate progress for ongoing mission
    const totalDecisions = 10; // Total decisions in the scenario
    const currentProgress = Math.min(newDecisionsMade, totalDecisions);
    const overallProgress = Math.round((currentProgress / totalDecisions) * 100);

    return NextResponse.json({ 
      speaker: "JARVIS",
      text: jarvisResponse,
      score: scoreData,
      missionStatus,
      decisionsMade: newDecisionsMade,
      safetyLevel: newSafetyLevel,
      missionComplete: false,
      progress: {
        current: currentProgress,
        total: totalDecisions,
        percentage: overallProgress
      }
    });

  } catch (error) {
    console.error("Space emergency API error:", error);
    return NextResponse.json(
      { error: "Failed to process space emergency request" },
      { status: 500 }
    );
  }
}
