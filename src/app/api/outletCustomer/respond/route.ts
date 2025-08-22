// ✅ src/app/api/outletCustomer/respond/route.ts
import { NextResponse } from "next/server";

// Add this function before POST
async function callOpenAI(messages: any[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function for retail customer service
async function scoreUserResponse(userMessage: string, questionContext: string) {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or empty" };
  }

  const scoringPrompt = {
    role: "system",
    content: `You are evaluating a customer's response to a cashier about multiple retail issues.

    THE ACTUAL SITUATION (reference truth):
    - Customer has jeans to return from last week WITH RECEIPT
    - T-shirt marked down to $15 but scanned at $25 (pricing error)
    - Has a $20 gift card to apply to purchase
    - Has screenshot showing same jacket $15 cheaper on store website (price match request)
    - Arrived around 2:30 PM today
    - All issues are legitimate and should be resolvable

    SCORING CRITERIA:
    - 1 point: Response includes accurate, specific details about the issues
    - 0 points: Response is vague, incorrect, or doesn't mention specific problems

    EXAMPLES:
    Question: "What can I help you with today?"
    - Good (1 point): "I have several things - a return, a pricing issue, and a gift card to use"
    - Bad (0 points): "I need help with my stuff" (too vague)

    Question: "Tell me about the return"
    - Good (1 point): "I bought these jeans last week and have the receipt"
    - Bad (0 points): "I want to return something" (no specifics)

    Question: "What's wrong with the T-shirt pricing?"
    - Good (1 point): "It's marked $15 but scanned $25" or "The clearance price didn't scan right"
    - Bad (0 points): "The price is wrong" (not specific enough)

    Respond with JSON: {"points": 0 or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Customer's response: "${userMessage}"
    
    Score this response based on clarity and specificity about their retail issues.`
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
    // Fallback scoring based on keywords
    const lowerResponse = userMessage.toLowerCase();
    
    // Simple keyword-based scoring for retail issues
    if (lowerResponse.includes("return") && (lowerResponse.includes("jeans") || lowerResponse.includes("receipt"))) {
      return { points: 1, maxPoints: 1, feedback: "Mentioned return with specifics" };
    } else if (lowerResponse.includes("15") && lowerResponse.includes("25") && lowerResponse.includes("shirt")) {
      return { points: 1, maxPoints: 1, feedback: "Specific pricing issue details" };
    } else if (lowerResponse.includes("gift card") && lowerResponse.includes("20")) {
      return { points: 1, maxPoints: 1, feedback: "Mentioned gift card amount" };
    } else if (lowerResponse.includes("screenshot") || (lowerResponse.includes("website") && lowerResponse.includes("cheaper"))) {
      return { points: 1, maxPoints: 1, feedback: "Provided price match evidence" };
    } else if (lowerResponse.includes("clearance") && lowerResponse.includes("scanned")) {
      return { points: 1, maxPoints: 1, feedback: "Explained scanning issue" };
    } else if (lowerResponse.includes("multiple") || lowerResponse.includes("several")) {
      return { points: 1, maxPoints: 1, feedback: "Acknowledged multiple issues" };
    }
    
    return { points: 0, maxPoints: 1, feedback: "Response needs more specific details" };
  }
}

// ✅ Determine which issues have been resolved
function updateIssuesResolved(conversationHistory: any[], currentIssues: any): any {
  const userMessages = conversationHistory
    .filter((msg: any) => msg.role === "user")
    .map((msg: any) => msg.content.toLowerCase());
  
  const allText = userMessages.join(" ");
  
  return {
    return: currentIssues.return || (allText.includes("return") && allText.includes("receipt")),
    clearance: currentIssues.clearance || (allText.includes("15") && allText.includes("25") && allText.includes("shirt")),
    giftCard: currentIssues.giftCard || (allText.includes("gift card") && allText.includes("20")),
    priceMatch: currentIssues.priceMatch || (allText.includes("screenshot") || (allText.includes("website") && allText.includes("cheaper")))
  };
}

// ✅ Your POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Received body in Level 6 /respond:", body);

    const { userMessage, conversationHistory = [], questionCount = 0, issuesResolved = {} } = body;

    // Customer service context that the AI cashier should reference
    const serviceContext = `
    CUSTOMER'S ACTUAL SITUATION (for cashier reference only):
    - Has jeans to return from last week (customer has receipt)
    - T-shirt marked $15 but scanned at $25 (legitimate pricing error)
    - Has $20 gift card to redeem
    - Has screenshot showing jacket $15 cheaper on store website (valid price match)
    - All issues are legitimate and should be handled professionally
    - Current time is around 2:30 PM
    `;

    // Score user's response if they provided one
    let scoreData = { points: 0, maxPoints: 1, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      const lastCashierQuestion = conversationHistory
        .filter((msg: any) => msg.role === "assistant")
        .pop()?.content || "initial greeting";
      
      scoreData = await scoreUserResponse(userMessage, lastCashierQuestion);
      console.log("📊 User score:", scoreData);
    }

    // Update issues resolved based on conversation
    const updatedIssues = updateIssuesResolved(conversationHistory, issuesResolved);
    const resolvedCount = Object.values(updatedIssues).filter(Boolean).length;

    const systemMsg = {
      role: "system",
      content: `You are Sarah, a friendly and helpful cashier at Fashion Outlet store.

      ${serviceContext}

      INSTRUCTIONS:
      - Stay friendly and open-ended
      - Let the customer explain each issue in their own words
      - Ask follow-up questions to get clear details
      - If they mention valid issues, work to resolve them
      - Be professional but conversational
      - Current question count: ${questionCount}
      - Issues resolved so far: ${resolvedCount}/4

      CASHIER PERSONALITY:
      - Helpful and patient
      - Asks clarifying questions
      - Acknowledges each issue as they mention it
      - Professional but warm tone
      - Efficient problem-solver

      TOPICS TO ADDRESS:
      1. Return process (jeans with receipt)
      2. Pricing correction (T-shirt clearance issue)
      3. Gift card application ($20 gift card)
      4. Price matching (website screenshot)

      EXAMPLE RESPONSES:
      - "Let me help you with that. Could you tell me more about..."
      - "I can definitely help with the return. Do you have your receipt?"
      - "Let me check that pricing for you..."
      - "I can apply that gift card to your purchase."

      Respond with a JSON object: {"speaker":"Sarah","text":"your response"}`,
    };
    
    const userPrompt = {
      role: "user",
      content: userMessage
        ? `Customer said: "${userMessage}". ${resolvedCount < 4 ? "Help them with their issues and ask follow-up questions as needed." : "Wrap up the transaction professionally."}`
        : `Greet the customer and ask how you can help them today.`,
    };
    
    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    // Fallback responses based on question count and issues
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "Hi there—what can I help you with today?",
        "Could you walk me through what you'd like to sort out with your purchase?",
        "Let's start with the first thing—what can you tell me about your return?",
        "What details do you have about the T-shirt discount?",
        "You mentioned a gift card. How would you like to use it today?",
        "What did you find about the jacket price on our website?",
        "Let me process these for you. Anything else I can help with?",
        "Perfect! Is there anything else you need help with today?",
        "Great! Your total comes to... Have a wonderful day!",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "Sarah", 
        text: fallbackQuestions[questionIndex]
      };
    }

    console.log("📤 Level 6 /respond sending:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);
    console.log("🛒 Issues resolved:", updatedIssues);

    return NextResponse.json({ 
      conversation: json,
      score: scoreData,
      issuesResolved: updatedIssues
    });
  } catch (err: any) {
    console.error("❌ Level 6 respond error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 