import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { SessionReportPDF } from "@/components/pdf/session-report";
import type { SessionWithDetails, NoteCategory } from "@/types";

export const dynamic = "force-dynamic";

async function checkAccess(id: string) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!session || session.company_id !== admin.company_id) {
    return { error: "Forbidden", status: 403 };
  }
  return { supabase, admin };
}

// GET report data (authenticated company access)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json(
      { error: access.error },
      { status: access.status as number }
    );

  const supabase = access.supabase!;
  
  try {
    // Find session by ID
    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        `*, scenes (*, poll_questions (*)), testers (*), notes (*, scene:scenes (*), tester:testers (*))`
      )
      .eq("id", id)
      .eq("status", "completed") // Ensure it's completed? Or maybe allow viewing active? The UI button was for completed only.
      .order("order_index", { referencedTable: "scenes", ascending: true })
      .order("created_at", { referencedTable: "notes", ascending: true })
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Report not found or not available" },
        { status: 404 }
      );
    }

    // Fetch poll responses for all testers in this session
    const testerIds = session.testers?.map((t: { id: string }) => t.id) || [];
    let pollResponses: {
      poll_question_id: string;
      tester_id: string;
      selected_options: string[];
    }[] = [];
    if (testerIds.length > 0) {
      const { data: responses } = await supabase
        .from("poll_responses")
        .select("*")
        .in("tester_id", testerIds);
      pollResponses = responses || [];
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
      pollResponses,
      summary: {
        total_notes: session.notes?.length || 0,
        category_breakdown: categoryBreakdown,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// POST to generate PDF (authenticated company access)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json(
      { error: access.error },
      { status: access.status as number }
    );

  const supabase = access.supabase!;

  try {
    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        `*, scenes (*, poll_questions (*)), testers (*), notes (*, scene:scenes (*), tester:testers (*))`
      )
      .eq("id", id)
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
        "Content-Disposition": `attachment; filename="${session.name.replace(
          /\s+/g,
          "-"
        )}-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
