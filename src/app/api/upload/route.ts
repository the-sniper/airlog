import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File;
  const sessionId = formData.get("sessionId") as string;
  const noteId = formData.get("noteId") as string;
  if (!audioFile || !sessionId || !noteId)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  const supabase = createAdminClient();
  const fileName = `${sessionId}/${noteId}.webm`;
  const arrayBuffer = await audioFile.arrayBuffer();
  await supabase.storage
    .from("audio-recordings")
    .upload(fileName, Buffer.from(arrayBuffer), {
      contentType: "audio/webm",
      upsert: true,
    });
  const { data } = supabase.storage
    .from("audio-recordings")
    .getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
