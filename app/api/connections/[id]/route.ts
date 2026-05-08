import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// PATCH /api/connections/[id] — accept a pending request (recipient only)
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

  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (connection.recipient_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (connection.status !== "pending") {
    return NextResponse.json({ error: "Already actioned" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("connections")
    .update({ status: "connected" })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/connections/[id] — decline (recipient) or remove (either party)
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

  const { data: connection } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .eq("id", params.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (connection.requester_id !== userId && connection.recipient_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
