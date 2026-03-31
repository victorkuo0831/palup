import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { randomUUID, createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const passwordHash = createHash("sha256").update(password).digest("hex");

    const accounts = await sql`
      SELECT id, email, name, company_name
      FROM auth_accounts
      WHERE email = ${email.toLowerCase().trim()} AND password_hash = ${passwordHash}
    `;

    if (accounts.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const account = accounts[0];

    // Create session
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (account_id, token, expires_at)
      VALUES (${account.id}, ${token}, ${expiresAt.toISOString()})
    `;

    const response = NextResponse.json({
      success: true,
      user: { id: account.id, email: account.email, name: account.name, companyName: account.company_name },
    });

    response.cookies.set("palup_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
