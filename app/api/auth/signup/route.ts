import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server auth configuration is missing." },
      { status: 500 }
    );
  }

  let payload: SignUpPayload;
  try {
    payload = (await request.json()) as SignUpPayload;
  } catch {
    return badRequest("Invalid request body.");
  }

  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;

  if (!fullName || !email || !password) {
    return badRequest("Full name, email, and password are required.");
  }

  if (password.length < 6) {
    return badRequest("Password must be at least 6 characters.");
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserError) {
    const message = createUserError.message || "Could not create account.";
    const status = /already|exists|registered/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const cookieStore = await cookies();
  const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error: signInError } = await sessionClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Account created, but sign-in failed. Please sign in manually." },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}