import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Signup route failed", error);
    return NextResponse.json(
      { error: "Unable to create account right now. Please try again." },
      { status: 500 }
    );
  }
}