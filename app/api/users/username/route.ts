import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";

// PATCH /api/users/username — update username and display_name
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, display_name } = await req.json();

  if (!username || !/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) {
    return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check not taken by someone else
  const { data: existing } = await supabase
    .from("users")
    .select("id, email")
    .eq("username", username)
    .single();

  if (existing && existing.email !== session.user.email) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  const updates: Record<string, string> = { username };
  if (display_name?.trim()) updates.display_name = display_name.trim();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("email", session.user.email)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}