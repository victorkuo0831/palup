import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Query real data from the database
    const [alerts, sessions, deploys, prompts, patterns, outcomes] = await Promise.all([
      sql`SELECT * FROM anomaly_alerts ORDER BY detected_at DESC LIMIT 20`,
      sql`SELECT * FROM debug_sessions ORDER BY started_at DESC LIMIT 10`,
      sql`SELECT * FROM deployments ORDER BY started_at DESC LIMIT 10`,
      sql`SELECT * FROM prompt_versions ORDER BY created_at DESC LIMIT 10`,
      sql`SELECT * FROM sales_patterns ORDER BY extracted_at DESC LIMIT 20`,
      sql`SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE outcome = 'positive') as positive,
           COUNT(*) FILTER (WHERE outcome = 'negative') as negative
           FROM sales_interaction_outcomes
           WHERE created_at > NOW() - INTERVAL '7 days'`,
    ]);

    return NextResponse.json({
      status: "online",
      timestamp: new Date().toISOString(),
      data: {
        anomalyAlerts: alerts,
        debugSessions: sessions,
        deployments: deploys,
        promptVersions: prompts,
        salesPatterns: patterns,
        outcomeStats: outcomes[0] || { total: 0, positive: 0, negative: 0 },
      },
      summary: {
        activeAlerts: alerts.filter((a: any) => a.status === "active").length,
        totalAlerts: alerts.length,
        activeDebugSessions: sessions.filter((s: any) => !["verified", "failed"].includes(s.status)).length,
        totalDeployments: deploys.length,
        promptVersionsCount: prompts.length,
        patternsDiscovered: patterns.length,
        interactionsThisWeek: Number(outcomes[0]?.total || 0),
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
