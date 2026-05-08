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

  // Fetch claimed items
  const { data: items, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("claimed_by", userId)
    .eq("claimed", true)
    .order("claimed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!items || items.length === 0) return NextResponse.json([]);

  // Fetch owner details separately
  const ownerIds = [...new Set(items.map((i: any) => i.user_id))];
  const { data: owners } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", ownerIds);

  const ownerMap = new Map((owners ?? []).map((o: any) => [o.id, o]));

  const result = items.map((item: any) => ({
    ...item,
    owner: ownerMap.get(item.user_id) ?? null,
  }));

  return NextResponse.json(result);
}