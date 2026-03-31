import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { randomUUID, createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password, name, companyName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Check if email already exists
    const existing = await sql`SELECT id FROM auth_accounts WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password (simple SHA-256 for demo — use bcrypt in production)
    const passwordHash = createHash("sha256").update(password).digest("hex");

    // Create account
    const [account] = await sql`
      INSERT INTO auth_accounts (email, name, company_name, password_hash)
      VALUES (${email.toLowerCase().trim()}, ${name || null}, ${companyName || null}, ${passwordHash})
      RETURNING id, email, name, company_name
    `;

    // Create session token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sql`
      INSERT INTO auth_sessions (account_id, token, expires_at)
      VALUES (${account.id}, ${token}, ${expiresAt.toISOString()})
    `;

    const response = NextResponse.json({
      success: true,
      user: { id: account.id, email: account.email, name: account.name, companyName: account.company_name },
    });

    // Set cookie
    response.cookies.set("palup_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
