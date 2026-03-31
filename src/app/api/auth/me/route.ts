import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("palup_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const sessions = await sql`
      SELECT a.id, a.email, a.name, a.company_name
      FROM auth_sessions s
      JOIN auth_accounts a ON a.id = s.account_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: sessions[0].id,
        email: sessions[0].email,
        name: sessions[0].name,
        companyName: sessions[0].company_name,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
