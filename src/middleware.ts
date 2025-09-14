import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/landing",
  "/purchase",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes to pass through
  if (isPublicRoute(req)) return;
  
  // Get auth state
  const { userId } = await auth();
  
  // Handle users who aren't authenticated
  if (!userId) {
    // Check if they have purchased but not signed up yet
    const purchaseStatus = req.nextUrl.searchParams.get('purchased') || 
                         req.cookies.get('speakgrade_purchase_status')?.value;
    
    if (purchaseStatus === 'purchased') {
      // Redirect to sign-up with purchase context
      const signUpUrl = new URL('/sign-up', req.url);
      signUpUrl.searchParams.set('purchased', 'true');
      return Response.redirect(signUpUrl);
    }
    
    // Regular redirect to sign-in
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
