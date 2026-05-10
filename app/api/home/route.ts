import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// GET /api/home — fetch home page data: user stats + trending items
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  // Fetch user stats in parallel
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

  const pendingCount = (connections ?? []).filter((c: any) =>
    c.status === "pending" && true
  ).length;

  const confirmedCount = (connections ?? []).filter(
    (c: any) => c.status === "connected"
  ).length;

  // Trending items — most added across all users (min 3 users, limit 20)
  const { data: trending } = await supabase
    .from("wishlist_items")
    .select("name, brand, image_url, price_display")
    .not("name", "is", null)
    .not("brand", "is", null);

  // Aggregate by name+brand in JS
  const countMap = new Map<string, { name: string; brand: string; image_url: string | null; price_display: string | null; count: number }>();

  for (const item of trending ?? []) {
    const key = `${item.name?.toLowerCase().trim()}|${item.brand?.toLowerCase().trim()}`;
    if (!key || key === "|") continue;
    const existing = countMap.get(key);
    if (existing) {
      existing.count++;
      // Prefer items that have images
      if (!existing.image_url && item.image_url) existing.image_url = item.image_url;
    } else {
      countMap.set(key, {
        name: item.name,
        brand: item.brand,
        image_url: item.image_url,
        price_display: item.price_display,
        count: 1,
      });
    }
  }

  const trendingItems = Array.from(countMap.values())
    .filter(i => i.count >= 2) // lower threshold for early scale
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return NextResponse.json({
    stats: {
      wishlistCount: wishlistCount ?? 0,
      claimedCount: claimedCount ?? 0,
      pendingCount,
      confirmedCount,
    },
    trending: trendingItems,
  });
}
