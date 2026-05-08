import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// GET /api/gifts-giving — fetch all items claimed by the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(`
      *,
      owner:users!wishlist_items_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("claimed_by", userId)
    .eq("claimed", true)
    .order("claimed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}