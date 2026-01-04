import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentCompanyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2MB limit
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    // Allow only images
    if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const fileExt = file.name.split('.').pop();
    // Sanitize filename
    const fileName = `${admin.company_id}/${Date.now()}.${fileExt}`;

    // ArrayBuffer is needed for 'upload' in some contexts, but 'File' usually works.
    // However, to be safe with Supabase server client, converting to ArrayBuffer can be safer.
    const fileBuffer = await file.arrayBuffer();

    const { error } = await supabase
      .storage
      .from('company-logos')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return NextResponse.json({ error: "Values storage error: " + error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('company-logos')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
