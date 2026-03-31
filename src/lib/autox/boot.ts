/**
 * Auto-X System Boot Script
 *
 * Run with: npx tsx src/lib/autox/boot.ts
 *
 * This starts the entire autonomous operations system:
 * - Monitor Agent: checks health every 5 minutes
 * - Debug/Fix Agent: auto-diagnoses and fixes issues
 * - Evolution Agent: weekly prompt optimization
 * - Deploy Agent: canary rollouts with auto-rollback
 */

import "dotenv/config";
import { startAutoXSystem } from "./scheduler";

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║      PalUp Auto-X System Starting...        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");

  try {
    const workers = await startAutoXSystem();

    console.log("");
    console.log("System is running. Press Ctrl+C to stop.");
    console.log("");

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\n[AutoX] Shutting down gracefully...");
      await Promise.all([
        workers.monitorWorker.close(),
        workers.debugFixWorker.close(),
        workers.evolutionWorker.close(),
        workers.deployWorker.close(),
      ]);
      console.log("[AutoX] All workers stopped. Goodbye.");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Keep the process alive
    await new Promise(() => {});
  } catch (error) {
    console.error("[AutoX] Failed to start:", error);
    process.exit(1);
  }
}

main();
