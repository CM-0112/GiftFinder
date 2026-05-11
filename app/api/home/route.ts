import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const [
    { count: wishlistCount },
    { count: claimedCount },
    { data: connections },
  ] = await Promise.all([
    supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true })
      .eq("claimed_by", userId)
      .eq("claimed", true),
    supabase
      .from("connections")
      .select("id, status")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
  ]);

  const pendingCount = (connections ?? []).filter((c: any) => c.status === "pending").length;
  const confirmedCount = (connections ?? []).filter((c: any) => c.status === "connected").length;

  return NextResponse.json({
    stats: {
      wishlistCount: wishlistCount ?? 0,
      claimedCount: claimedCount ?? 0,
      pendingCount,
      confirmedCount,
    },
  });
}

