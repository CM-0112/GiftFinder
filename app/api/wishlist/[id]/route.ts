import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// PATCH /api/wishlist/[id] — edit item (owner) or claim/unclaim (connected user)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const { data: item } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const isOwner = item.user_id === userId;

  // ── Owner: edit fields or reset a claim ──
  if (isOwner) {
    const allowedFields = ["name", "brand", "price_display", "image_url", "product_url", "note", "position"];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    // Owner claim reset
    if ("claimed" in body && body.claimed === false) {
      updates.claimed = false;
      updates.claimed_at = null;
    }

    if (updates.note && updates.note.length > 200) {
      return NextResponse.json({ error: "note must be 200 characters or fewer" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // ── Connected user: claim only ──
  const { data: connection } = await supabase
    .from("connections")
    .select("id")
    .eq("status", "connected")
    .or(
      `and(requester_id.eq.${userId},recipient_id.eq.${item.user_id}),` +
      `and(requester_id.eq.${item.user_id},recipient_id.eq.${userId})`
    )
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.claimed !== true) {
    return NextResponse.json({ error: "Connected users may only claim items" }, { status: 403 });
  }

  if (item.claimed) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/wishlist/[id] — owner only
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const { data: item } = await supabase
    .from("wishlist_items")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (item.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
