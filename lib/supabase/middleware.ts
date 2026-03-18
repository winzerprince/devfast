import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/verify", "/auth/callback", "/auth/confirm"];
  const isPublicAuthApiRoute = pathname.startsWith("/api/auth/");
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/")
  ) || isPublicAuthApiRoute;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicRoute) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          } catch {
            // Ignore request cookie mutation errors in Edge/runtime differences.
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          } catch {
            // Ignore response cookie mutation errors and continue request flow.
          }
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && pathname.startsWith("/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
