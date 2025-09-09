import { NextRequest, NextResponse } from 'next/server';

interface ConversationRequest {
  message: string;
  conversationHistory: Array<{role: string, content: string}>;
  currentScore: number;
  questionCount: number;
  issuesResolved: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationRequest = await request.json();
    const { message, conversationHistory, currentScore, questionCount, issuesResolved } = body;

    // Order issue tracking
    const orderIssues = [
      { id: "burger_onions", keywords: ["onion", "burger", "no onion", "without onion"], points: 25 },
      { id: "fries_size", keywords: ["fries", "small", "medium", "size", "upgrade"], points: 25 },
      { id: "drink_type", keywords: ["coke", "diet", "regular", "drink", "soda"], points: 25 },
      { id: "missing_rings", keywords: ["onion rings", "coupon", "missing", "free"], points: 25 }
    ];

    let newScore = currentScore;
    let newIssuesResolved = [...issuesResolved];
    let conversationComplete = false;

    // Check for issue mentions and award points
    const lowerMessage = message.toLowerCase();
    
    orderIssues.forEach(issue => {
      if (!issuesResolved.includes(issue.id)) {
        const hasKeyword = issue.keywords.some(keyword => 
          lowerMessage.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword) {
          newScore += issue.points;
          newIssuesResolved.push(issue.id);
        }
      }
    });

    // Generate Mike's response based on conversation context
    let mikeResponse = "";
    const newQuestionCount = questionCount + 1;

    // Determine Mike's response style based on what issues are mentioned
    if (newQuestionCount === 1) {
      // First interaction - Mike asks for details
      if (lowerMessage.includes("order") || lowerMessage.includes("wrong") || lowerMessage.includes("mistake")) {
        mikeResponse = "Oh no! I'm sorry about that. What exactly is wrong with your order? Let me help fix that for you.";
      } else if (newIssuesResolved.length > 0) {
        mikeResponse = "I can definitely help fix that. Can you show me your receipt so I can see what happened?";
      } else {
        mikeResponse = "I'm here to help! Can you tell me specifically what's wrong with your order?";
      }
    } else if (newQuestionCount <= 5) {
      // Middle conversation - acknowledge issues and verify
      if (newIssuesResolved.includes("burger_onions") && !conversationHistory.some(msg => msg.content.includes("new burger"))) {
        mikeResponse = "I see the problem with your burger - it has onions when you ordered no onions. Let me get you a fresh burger without onions right away.";
      } else if (newIssuesResolved.includes("fries_size") && !conversationHistory.some(msg => msg.content.includes("upgrade"))) {
        mikeResponse = "You're right, these are small fries and you ordered medium. I'll upgrade those to medium fries for you.";
      } else if (newIssuesResolved.includes("drink_type") && !conversationHistory.some(msg => msg.content.includes("regular Coke"))) {
        mikeResponse = "I can see you got diet Coke instead of regular. Let me get you a regular Coke right now.";
      } else if (newIssuesResolved.includes("missing_rings") && !conversationHistory.some(msg => msg.content.includes("onion rings"))) {
        mikeResponse = "I see your coupon here for the free onion rings. Let me get those prepared for you right away.";
      } else if (lowerMessage.includes("receipt") || lowerMessage.includes("coupon")) {
        mikeResponse = "Perfect, I can see your receipt and coupon. Let me take care of all these issues for you. This will just take a few minutes.";
      } else {
        mikeResponse = "Is there anything else wrong with your order that I should know about?";
      }
    } else {
      // Later conversation - wrap up
      if (newIssuesResolved.length >= 3) {
        mikeResponse = "Alright, I think we've got everything sorted out now. Your corrected order will be ready in just a minute. Sorry for the mix-up!";
        conversationComplete = true;
      } else {
        mikeResponse = "Let me double-check - is there anything else we need to fix with your order?";
      }
    }

    // Check completion conditions
    if (newIssuesResolved.length >= 4 || newQuestionCount >= 10) {
      conversationComplete = true;
      if (!mikeResponse.includes("sorted out")) {
        mikeResponse = "Perfect! I've got all your order issues fixed now. Everything should be correct this time. Thanks for your patience!";
      }
    }

    return NextResponse.json({
      response: mikeResponse,
      score: newScore,
      questionCount: newQuestionCount,
      issuesResolved: newIssuesResolved,
      conversationComplete
    });

  } catch (error) {
    console.error('Error in order mix-up conversation:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}
