import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { extractAndSavePDF } from "@/inngest/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serve the Inngest endpoint from the Node runtime so the server bundle stays stable.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    extractAndSavePDF
  ],
});
