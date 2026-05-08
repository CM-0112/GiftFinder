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

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const supabase = createServiceClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${q}%`)
    .neq("id", userId)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, recipient_id, status, id")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const connectionMap = new Map(
    (connections ?? []).map((c: { requester_id: string; recipient_id: string; status: string; id: string }) => {
      const otherId = c.requester_id === userId ? c.recipient_id : c.requester_id;
      return [otherId, c];
    })
  );

  const results = (users ?? []).map((u: { id: string; username: string; display_name: string | null; avatar_url: string | null }) => {
    const conn = connectionMap.get(u.id);
    let relationship = "none";
    if (conn) {
      if (conn.status === "connected") relationship = "connected";
      else if (conn.requester_id === userId) relationship = "pending_sent";
      else relationship = "pending_received";
    }
    return { ...u, relationship };
  });

  return NextResponse.json(results);
}
