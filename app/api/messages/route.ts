import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chat_id, sender_id, content, image_url } = body;

    if (!chat_id || !sender_id) {
      return NextResponse.json({ error: "Missing chat_id or sender_id" }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data, error } = await sb.from("messages").insert({
      chat_id,
      sender_id,
      content,
      image_url,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}