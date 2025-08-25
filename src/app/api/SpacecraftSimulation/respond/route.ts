import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: string;
  content: string;
}

interface MissionStep {
  question: string;
  answer: string;
  hint: string;
  scenario: string;
}

interface RequestBody {
  transcript?: string;
  conversationHistory?: Message[];
  currentStep?: number;
  missionSteps?: MissionStep[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { transcript, conversationHistory = [], currentStep = 0, missionSteps = [] }: RequestBody = await req.json();
  
    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    // Default mission steps for spaceship simulation
    const defaultMissionSteps: MissionStep[] = [
      {
        question: "Captain, we're approaching an asteroid field! What should we do to navigate safely?",
        answer: "slow down and scan for safe passage",
        hint: "Think about safety first - what would a good captain do when approaching dangerous obstacles?",
        scenario: "Asteroid field navigation"
      },
      {
        question: "We've detected a distress signal from a nearby planet. How should we respond?",
        answer: "investigate the signal and prepare for rescue",
        hint: "Consider your duty as a space captain - what's the right thing to do when someone needs help?",
        scenario: "Distress signal response"
      },
      {
        question: "Our fuel levels are getting low. What's the best course of action?",
        answer: "find the nearest space station or fuel depot",
        hint: "Think about resource management - where can you get more fuel in space?",
        scenario: "Fuel management"
      },
      {
        question: "We're entering a solar storm! What should we do to protect the ship?",
        answer: "activate shields and find shelter",
        hint: "Consider the danger - how do you protect yourself from solar radiation?",
        scenario: "Solar storm protection"
      },
      {
        question: "We've discovered a mysterious alien artifact. How should we proceed?",
        answer: "document it carefully and report to command",
        hint: "Think about protocol - what's the proper way to handle unknown objects in space?",
        scenario: "Alien artifact discovery"
      }
    ];

    const steps = missionSteps.length > 0 ? missionSteps : defaultMissionSteps;
    const currentMissionStep = steps[currentStep];
    
    if (!currentMissionStep) {
      return NextResponse.json({ 
        reply: "🎉 Mission completed! You've successfully navigated through all the space challenges with excellent decision-making skills! 🚀",
        isCorrect: true,
        isCompleted: true
      });
    }

    // Check if user's answer is correct using key concept matching
    const userAnswer = transcript.toLowerCase().trim();
    const keyConcepts = currentMissionStep.answer.toLowerCase().split(' ');
    
    const isCorrect = keyConcepts.some(concept => 
      userAnswer.includes(concept) || 
      (concept === 'slow' && userAnswer.includes('slow')) ||
      (concept === 'investigate' && userAnswer.includes('investigate')) ||
      (concept === 'find' && userAnswer.includes('find')) ||
      (concept === 'activate' && userAnswer.includes('activate')) ||
      (concept === 'document' && userAnswer.includes('document')) ||
      (concept === 'scan' && userAnswer.includes('scan')) ||
      (concept === 'passage' && userAnswer.includes('passage')) ||
      (concept === 'rescue' && userAnswer.includes('rescue')) ||
      (concept === 'station' && userAnswer.includes('station')) ||
      (concept === 'depot' && userAnswer.includes('depot')) ||
      (concept === 'shields' && userAnswer.includes('shields')) ||
      (concept === 'shelter' && userAnswer.includes('shelter')) ||
      (concept === 'report' && userAnswer.includes('report')) ||
      (concept === 'command' && userAnswer.includes('command'))
    );

    // Check for mission failure (too many wrong attempts)
    const wrongAttempts = conversationHistory.filter(msg => 
      msg.role === 'user' && 
      !keyConcepts.some(concept => msg.content.toLowerCase().includes(concept))
    ).length;

    let reply = "";
    let isFailed = false;

    if (wrongAttempts >= 3) {
      isFailed = true;
      reply = `💥 CRITICAL ERROR! Too many failed attempts! The spacecraft systems are failing! Mission aborted! ${currentMissionStep.hint}`;
    } else if (isCorrect) {
      if (currentStep < steps.length - 1) {
        const nextStep = steps[currentStep + 1];
        reply = `✅ Excellent decision, Captain! ${nextStep.question}`;
      } else {
        reply = "🎉 MISSION ACCOMPLISHED! You've successfully completed all spacecraft challenges! The ship is now fully operational! 🚀";
      }
    } else {
      reply = `❌ That's not quite right, Captain. ${currentMissionStep.hint} Try again!`;
    }

    return NextResponse.json({ 
      reply,
      isCorrect,
      isFailed,
      currentStep: isCorrect ? currentStep + 1 : currentStep,
      isCompleted: isCorrect && currentStep >= steps.length - 1
    });

  } catch (err) {
    console.error("❌ SpacecraftSimulation respond error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
