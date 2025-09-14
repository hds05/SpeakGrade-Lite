import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserCreditStatus } from "@/lib/apiTracking";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    console.log("🔐 Auth result:", { userId });
    
    if (!userId) {
      console.log("❌ No userId found");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.log("✅ Getting credit status for user:", userId);
    const creditStatus = await getUserCreditStatus(userId);
    console.log("📊 Credit status result:", creditStatus);
    
    return NextResponse.json(creditStatus);
  } catch (error) {
    console.error("❌ Error fetching credit status:", error);
    console.error("📋 Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch credit status",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}
