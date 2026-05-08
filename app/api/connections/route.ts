import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// GET /api/connections — list confirmed connections + pending requests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("connections")
    .select(`
      *,
      requester:users!connections_requester_id_fkey(id, username, display_name, avatar_url),
      recipient:users!connections_recipient_id_fkey(id, username, display_name, avatar_url)
    `)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Normalise so each item has a `user` field = the other person
  const normalised = (data ?? []).map((c: any) => ({
    ...c,
    user: c.requester_id === userId ? c.recipient : c.requester,
  }));

  return NextResponse.json(normalised);
}

// POST /api/connections — send a connection request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // @ts-ignore
  const userId: string = session.user.id;
  const { recipient_id } = await req.json();

  if (!recipient_id || recipient_id === userId) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check no existing connection in either direction
  const { data: existing } = await supabase
    .from("connections")
    .select("id")
    .or(
      `and(requester_id.eq.${userId},recipient_id.eq.${recipient_id}),` +
      `and(requester_id.eq.${recipient_id},recipient_id.eq.${userId})`
    )
    .single();

  if (existing) {
    return NextResponse.json({ error: "Connection already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: userId, recipient_id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
