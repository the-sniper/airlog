// Run this script to apply the pending_invites migration
// Usage: npx tsx scripts/run-migration-022.ts

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables manually from .env.local
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex);
        const value = trimmed.slice(eqIndex + 1).replace(/^["']|["']$/g, "");
        process.env[key] = value;
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing SUPABASE environment variables");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log("🚀 Running migration 022: Create pending_invites table...\n");

    // First check if table already exists
    const { error: checkError } = await supabase
        .from("pending_invites")
        .select("id")
        .limit(1);

    if (!checkError) {
        console.log("✅ Table pending_invites already exists. Migration skipped.");
        return;
    }

    // If table doesn't exist, print instructions
    const migrationSQL = `
-- Create pending_invites table for tracking invitations to unregistered users
CREATE TABLE IF NOT EXISTS pending_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invite_type VARCHAR(50) NOT NULL CHECK (invite_type IN ('session', 'team')),
    target_id UUID NOT NULL,
    invited_by UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    claimed_at TIMESTAMPTZ,
    UNIQUE(email, invite_type, target_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_target ON pending_invites(invite_type, target_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_expires ON pending_invites(expires_at) WHERE claimed_at IS NULL;

-- Enable RLS with open policies (consistent with other tables)
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pending invites are viewable by everyone" ON pending_invites
    FOR SELECT USING (true);

CREATE POLICY "Pending invites can be created by anyone" ON pending_invites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Pending invites can be updated by anyone" ON pending_invites
    FOR UPDATE USING (true);

CREATE POLICY "Pending invites can be deleted by anyone" ON pending_invites
    FOR DELETE USING (true);
`;

    console.log("⚠️  The pending_invites table does not exist.");
    console.log("   Please run the following SQL in Supabase Dashboard → SQL Editor:\n");
    console.log("─".repeat(60));
    console.log(migrationSQL);
    console.log("─".repeat(60));
    console.log("\n   File location: supabase/migrations/022_pending_invites.sql\n");
}

runMigration().catch(console.error);
