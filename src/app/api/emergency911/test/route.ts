import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to check if OpenAI API is working
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🧪 Testing OpenAI API connection...");
    console.log("🔑 API Key present:", !!process.env.OPENAI_API_KEY);
    console.log("🔑 API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    console.log("🔑 API Key starts with sk-:", process.env.OPENAI_API_KEY?.startsWith('sk-') || false);
    
    const testRequest = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a test assistant. Respond with valid JSON: {\"test\": \"success\", \"message\": \"API is working\"}"
        },
        {
          role: "user", 
          content: "Please respond with the test JSON format"
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    };

    console.log("📤 Sending test request to OpenAI...");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testRequest),
    });

    console.log("📥 Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ OpenAI test failed:", errorText);
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${res.status} - ${errorText}`,
        details: {
          status: res.status,
          statusText: res.statusText,
          hasApiKey: !!process.env.OPENAI_API_KEY,
          apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
        }
      }, { status: 500 });
    }

    const data = await res.json();
    console.log("✅ OpenAI response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || "";
    console.log("📝 Content:", content);

    // Try to parse the JSON response
    let parsedContent = null;
    try {
      parsedContent = JSON.parse(content);
      console.log("✅ JSON parsed successfully:", parsedContent);
    } catch (parseError) {
      console.warn("⚠️ JSON parse failed:", parseError);
    }

    return NextResponse.json({
      success: true,
      rawResponse: data,
      content: content,
      parsedContent: parsedContent,
      details: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        model: data.model,
        usage: data.usage
      }
    });

  } catch (error) {
    console.error("💥 Test endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
      }
    }, { status: 500 });
  }
}
