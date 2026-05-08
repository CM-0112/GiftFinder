import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/supabase/server";

// GET /api/share?token= — fetch a wishlist by share token (no auth required)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find user by share token
  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("share_token", token)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch their wishlist items
  const { data: items } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  return NextResponse.json({ user, items: items ?? [] });
}
