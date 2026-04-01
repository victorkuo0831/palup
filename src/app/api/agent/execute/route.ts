import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";

export const maxDuration = 60; // Allow up to 60s for LLM calls

export async function POST(req: Request) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("palup_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const sessions = await sql`
      SELECT a.id, a.email, a.name, a.company_name
      FROM auth_sessions s JOIN auth_accounts a ON a.id = s.account_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const user = sessions[0];
    const { goal } = await req.json();

    if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
      return NextResponse.json({ error: "Please describe what you want to do" }, { status: 400 });
    }

    // Step 1: Interpret the goal with Claude
    const client = new Anthropic();

    const interpretation = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are PalUp's Sales Agent. The user will describe their business and what they want.
Your job: understand what they sell, who their ideal customers are, and prepare to find prospects.

Respond in JSON only:
{
  "product": "what they sell (1 sentence)",
  "targetCustomer": "who would buy this (specific: industry, role, company size)",
  "icp": {
    "industries": ["industry1", "industry2"],
    "roles": ["VP of X", "Director of Y"],
    "companySize": "e.g. 50-500 employees",
    "geography": "e.g. United States"
  },
  "searchStrategy": "how you'll find these customers (1-2 sentences)"
}`,
      messages: [{ role: "user", content: goal }],
    });

    const icpText = interpretation.content[0].type === "text" ? interpretation.content[0].text : "";
    let icp;
    try {
      const jsonMatch = icpText.match(/\{[\s\S]*\}/);
      icp = JSON.parse(jsonMatch ? jsonMatch[0] : icpText);
    } catch {
      icp = { product: goal, targetCustomer: "Unknown", icp: {}, searchStrategy: "General search" };
    }

    // Step 2: Find real prospects with Claude
    const prospecting = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: `You are a B2B sales prospecting expert. Based on the ICP, find 5 REAL companies that would be good prospects.
Use your knowledge of real companies. For each prospect:
- Use a real company name that actually exists
- Find the right department/role to contact
- Create a realistic contact name and title
- Explain why they're a good fit
- Write a short personalized outreach message (3-4 sentences, friendly, value-focused)

Respond in JSON only:
{
  "prospects": [
    {
      "company": "Real Company Name",
      "website": "company.com",
      "industry": "their industry",
      "size": "employee count estimate",
      "contactName": "Realistic Name",
      "contactTitle": "Their Title",
      "contactEmail": "firstname@company.com",
      "whyGoodFit": "1-2 sentences why they'd buy",
      "outreachMessage": "Subject: ...\n\nHi [Name],\n\n..."
    }
  ]
}`,
      messages: [{
        role: "user",
        content: `Find 5 real prospect companies for this business:

Product: ${icp.product}
Target: ${icp.targetCustomer}
Industries: ${icp.icp?.industries?.join(", ") || "Any"}
Roles: ${icp.icp?.roles?.join(", ") || "Decision makers"}
Company size: ${icp.icp?.companySize || "Any"}
Geography: ${icp.icp?.geography || "Global"}`
      }],
    });

    const prospectText = prospecting.content[0].type === "text" ? prospecting.content[0].text : "";
    let prospects;
    try {
      const jsonMatch = prospectText.match(/\{[\s\S]*\}/);
      prospects = JSON.parse(jsonMatch ? jsonMatch[0] : prospectText);
    } catch {
      prospects = { prospects: [] };
    }

    // Step 3: Save to database
    const goalId = crypto.randomUUID();
    await sql`
      INSERT INTO goals (id, org_id, raw_input, interpreted_summary, status, metadata)
      VALUES (
        ${goalId},
        ${user.id},
        ${goal},
        ${icp.product + " — targeting " + icp.targetCustomer},
        'executing',
        ${JSON.stringify({ icp, prospects: prospects.prospects })}
      )
    `;

    // Save each prospect as a sales interaction outcome
    for (const p of prospects.prospects || []) {
      await sql`
        INSERT INTO sales_interaction_outcomes (org_id, agent_type, interaction_type, input_summary, output_summary, outcome, metadata)
        VALUES (
          ${user.id},
          'sales_crm',
          'outreach',
          ${`Prospect: ${p.company} — ${p.contactName}, ${p.contactTitle}`},
          ${p.outreachMessage || ''},
          'pending',
          ${JSON.stringify(p)}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      goalId,
      interpretation: icp,
      prospects: prospects.prospects || [],
    });

  } catch (error) {
    console.error("Agent execute error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    }, { status: 500 });
  }
}
