import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SessionReportPDF } from "@/components/pdf/session-report";
import type { SessionWithDetails, NoteCategory } from "@/types";

export const dynamic = "force-dynamic";

// GET report data by share token (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const supabase = createAdminClient();

    // Find session by share token
    const { data: session, error } = await supabase
      .from("sessions")
      .select(`*, scenes (*), testers (*), notes (*, scene:scenes (*), tester:testers (*))`)
      .eq("share_token", token)
      .eq("status", "completed")
      .order("order_index", { referencedTable: "scenes", ascending: true })
      .order("created_at", { referencedTable: "notes", ascending: true })
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Report not found or not available" },
        { status: 404 }
      );
    }

    // Calculate category breakdown
    const categoryBreakdown: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    session.notes?.forEach((note: { category: NoteCategory }) => {
      categoryBreakdown[note.category]++;
    });

    return NextResponse.json({
      session,
      summary: {
        total_notes: session.notes?.length || 0,
        category_breakdown: categoryBreakdown,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching public report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// POST to generate PDF (public access)
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const supabase = createAdminClient();

    // Find session by share token
    const { data: session, error } = await supabase
      .from("sessions")
      .select(`*, scenes (*), testers (*), notes (*, scene:scenes (*), tester:testers (*))`)
      .eq("share_token", token)
      .eq("status", "completed")
      .order("order_index", { referencedTable: "scenes", ascending: true })
      .order("created_at", { referencedTable: "notes", ascending: true })
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Report not found or not available" },
        { status: 404 }
      );
    }

    const pdfBuffer = await renderToBuffer(
      SessionReportPDF({ session: session as SessionWithDetails })
    );
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${session.name.replace(/\s+/g, "-")}-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating public PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
