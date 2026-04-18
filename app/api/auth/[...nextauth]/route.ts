import { handlers } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const unstable_allowDynamic = ["/node_modules/next-auth/**/*"];

// CORS headers for API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const GET = handlers.GET;
const POST = handlers.POST;

export { GET, POST };
