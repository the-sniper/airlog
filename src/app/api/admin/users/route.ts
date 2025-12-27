import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * List all registered users for admin selection
 * Query params:
 *   - search: optional search term (name or email)
 *   - limit: max results (default 50)
 *   - exclude: comma-separated user IDs to exclude
 */
export async function GET(req: NextRequest) {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const excludeParam = searchParams.get("exclude") || "";
    const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

    let query = supabase
        .from("users")
        .select("id, first_name, last_name, email, created_at")
        .order("first_name", { ascending: true })
        .limit(limit);

    // Apply search filter if provided
    if (search) {
        // Search by name or email (case-insensitive)
        query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
    }

    // Exclude specific user IDs if provided
    if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[API GET /admin/users] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}
