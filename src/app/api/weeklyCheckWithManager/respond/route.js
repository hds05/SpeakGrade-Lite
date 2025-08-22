import { NextResponse } from "next/server";

// ✅ Call OpenAI function
async function callOpenAI(messages) {
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
      max_tokens: 250,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function
async function scoreUserResponse(userMessage, questionContext) {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or empty" };
  }

  const scoringPrompt = {
    role: "system",
    content: `You are evaluating an employee's response in a workplace conversation.

    EMPLOYEE'S ACTUAL WORK (reference truth):
    - Made 3 Facebook ads for new clothing campaign
    - Worked with design team to choose pictures and write short texts
    - Posted 4 Instagram photos for summer sale promotion
    - Checked last week's ad performance - one ad had 25% more clicks than usual
    - Conducted online survey about customer style preferences
    - Found that bright colors were the top customer choice
    - Prepared a 2-page report with survey results on Friday

    SCORING CRITERIA:
    - 1 point: Response is accurate and includes specific details from the work done
    - 0 points: Response is vague, incorrect, or doesn't match the actual work

    Respond with JSON: {"points": 0 or 1, "maxPoints": 1, "feedback": "brief explanation"}`,
  };

  const userPrompt = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Employee's response: "${userMessage}"
    
    Score this response based on accuracy and specificity compared to the actual work done.`,
  };

  try {
    const response = await callOpenAI([scoringPrompt, userPrompt]);
    const scoreData = JSON.parse(response);
    return {
      points: scoreData.points || 0,
      maxPoints: 1,
      feedback: scoreData.feedback || "",
    };
  } catch {
    // fallback scoring with keywords
    const lowerResponse = userMessage.toLowerCase();

    if (lowerResponse.includes("three") && lowerResponse.includes("facebook") && lowerResponse.includes("ads")) {
      return { points: 1, maxPoints: 1, feedback: "Correct details about Facebook ads" };
    } else if (lowerResponse.includes("four") && lowerResponse.includes("instagram") && lowerResponse.includes("photos")) {
      return { points: 1, maxPoints: 1, feedback: "Correct details about Instagram posts" };
    } else if ((lowerResponse.includes("25%") || lowerResponse.includes("25 percent")) && lowerResponse.includes("clicks")) {
      return { points: 1, maxPoints: 1, feedback: "Correct ad performance details" };
    } else if (lowerResponse.includes("bright colors") && lowerResponse.includes("survey")) {
      return { points: 1, maxPoints: 1, feedback: "Correct survey findings" };
    } else if (lowerResponse.includes("design team") && lowerResponse.includes("pictures")) {
      return { points: 1, maxPoints: 1, feedback: "Correct collaboration details" };
    } else if (lowerResponse.includes("two") && lowerResponse.includes("page") && lowerResponse.includes("report")) {
      return { points: 1, maxPoints: 1, feedback: "Correct report details" };
    }

    return { points: 0, maxPoints: 1, feedback: "Response needs more specific details" };
  }
}

// ✅ POST handler
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("✅ Received body in Level 4 /respond:", body);

    const { userMessage, conversationHistory = [], questionCount = 0 } = body;

    const weeklyUpdateContext = `
    EMPLOYEE'S WEEKLY UPDATE:
    - Made 3 Facebook ads for new clothing campaign
    - Worked with design team to choose pictures and write short texts
    - Posted 4 Instagram photos for summer sale promotion
    - Checked last week's ad performance - one ad had 25% more clicks than usual
    - Conducted online survey about customer style preferences
    - Found that bright colors were the top customer choice
    - Prepared a 2-page report with survey results on Friday
    `;

    const systemMsg = {
      role: "system",
      content: `You are Charlie, a professional but friendly marketing manager conducting a weekly check-in with your employee.

      ${weeklyUpdateContext}

      INSTRUCTIONS:
      - Ask simple, realistic workplace questions
      - If their answer doesn't match, politely guide them back
      - Be professional but warm
      - Do NOT read the update aloud
      - Focus on one topic at a time
      - Current question count: ${questionCount}

      Respond with: {"speaker":"Charlie","text":"your response"}`,
    };

    const userPrompt = {
      role: "user",
      content: userMessage
        ? `Employee answered: "${userMessage}". Ask your next question or provide feedback.`
        : `Start the weekly check-in by asking about their ad work this week.`,
    };

    // Score user’s response
    let scoreData = { points: 0, maxPoints: 1, feedback: "" };
    if (userMessage && userMessage.trim()) {
      const lastManagerQuestion =
        conversationHistory.filter((msg) => msg.role === "assistant").pop()?.content || "initial question";

      scoreData = await scoreUserResponse(userMessage, lastManagerQuestion);
      console.log("📊 User score:", scoreData);
    }

    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json;
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

    // Fallback if GPT messes up
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "What did you work on this week related to ads?",
        "How many Instagram posts did you make for the summer sale?",
        "Did you notice any changes in the clicks or views for last week's ads?",
        "What did you find out about customer preferences?",
        "How did working with the design team go this week?",
        "What kind of report did you prepare for me?",
        "Great work this week! Any challenges you faced?",
        "Thanks for the update. Keep up the excellent work!",
      ];

      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = {
        speaker: "Charlie",
        text: fallbackQuestions[questionIndex],
      };
    }

    console.log("📤 Sending response:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);

    return NextResponse.json({
      conversation: json,
      score: scoreData,
    });
  } catch (err) {
    console.error("❌ Error in /respond", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
