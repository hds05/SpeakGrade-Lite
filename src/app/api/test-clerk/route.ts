import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🧪 Testing Clerk configuration...");
    
    // Test 1: Auth
    const { userId } = await auth();
    console.log("🔐 Auth result:", { userId: userId ? "✅ Found" : "❌ Not found" });
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated",
        test: "auth",
        status: "failed"
      });
    }

    // Test 2: Clerk Client
    console.log("🏢 Testing clerkClient...");
    const user = await clerkClient.users.getUser(userId);
    console.log("👤 User data:", {
      id: user.id,
      emailAddresses: user.emailAddresses.map(e => e.emailAddress),
      createdAt: user.createdAt,
      publicMetadata: user.publicMetadata
    });

    return NextResponse.json({
      status: "success",
      tests: {
        auth: "✅ Working",
        clerkClient: "✅ Working",
        userData: "✅ Retrieved"
      },
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        hasMetadata: !!user.publicMetadata,
        metadataKeys: Object.keys(user.publicMetadata || {})
      }
    });

  } catch (error) {
    console.error("❌ Clerk test failed:", error);
    return NextResponse.json({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
