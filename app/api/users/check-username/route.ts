import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// GET /api/users/check-username?username= — check if a username is available
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();
  if (!username) {
    return NextResponse.json({ available: false });
  }

  // Validate format
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const supabase = createServiceClient();

  // Check if taken by anyone other than the current user
  const { data } = await supabase
    .from("users")
    .select("id, email")
    .eq("username", username)
    .single();

  if (!data) {
    return NextResponse.json({ available: true });
  }

  // It's taken by the current user — still "available" for them to keep
  const available = data.email === session.user.email;
  return NextResponse.json({ available });
}
