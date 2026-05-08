import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// GET /api/wishlist?username= — fetch a user's wishlist
// - owner: gets full list including claimed status
// - connected user: gets full list
// - anyone else: 403
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const viewerId: string = session.user.id;

  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Resolve username → user id
  const { data: owner } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!owner) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ownerId = owner.id;

  // Owner can always see their own list
  if (viewerId !== ownerId) {
    const { data: connection } = await supabase
      .from("connections")
      .select("id")
      .eq("status", "connected")
      .or(
        `and(requester_id.eq.${viewerId},recipient_id.eq.${ownerId}),` +
        `and(requester_id.eq.${ownerId},recipient_id.eq.${viewerId})`
      )
      .single();

    if (!connection) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", ownerId)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/wishlist — add a new wishlist item (owner only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const body = await req.json();
  const { name, brand, price_display, image_url, product_url, note } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (note && note.length > 200) {
    return NextResponse.json({ error: "note must be 200 characters or fewer" }, { status: 400 });
  }

  // Place new item at the end
  const { count } = await supabase
    .from("wishlist_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      user_id: userId,
      name: name.trim(),
      brand: brand?.trim() ?? null,
      price_display: price_display?.trim() ?? null,
      image_url: image_url ?? null,
      product_url: product_url ?? null,
      note: note?.trim() ?? null,
      position: count ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
