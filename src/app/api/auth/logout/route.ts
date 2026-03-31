import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("palup_session")?.value;

    if (token) {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("palup_session");
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("palup_session");
    return response;
  }
}
