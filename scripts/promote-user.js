#!/usr/bin/env node

/**
 * Promote a user to Owner or Admin of a company
 * 
 * Usage:
 *   node scripts/promote-user.js <email> <company_name> <role>
 * 
 * Examples:
 *   node scripts/promote-user.js areefsyed021@gmail.com "Collidascope" admin
 *   node scripts/promote-user.js areefsyed021@gmail.com "Collidascope" owner
 * 
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  console.error("\n💡 Run with:");
  console.error('   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/promote-user.js <email> <company> <role>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VALID_ROLES = ["owner", "admin"];

async function main() {
  const [email, companyName, role] = process.argv.slice(2);

  // Validate arguments
  if (!email || !companyName || !role) {
    console.error("❌ Missing arguments");
    console.error("\nUsage: node scripts/promote-user.js <email> <company_name> <role>");
    console.error("\nExamples:");
    console.error('  node scripts/promote-user.js user@example.com "My Company" admin');
    console.error('  node scripts/promote-user.js user@example.com "My Company" owner');
    process.exit(1);
  }

  const normalizedRole = role.toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    console.error(`❌ Invalid role: "${role}"`);
    console.error(`   Valid roles are: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user: ${email}`);

  // Find the user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("email", email.toLowerCase())
    .single();

  if (userError || !user) {
    console.error(`❌ User not found: ${email}`);
    if (userError) console.error(`   Error: ${userError.message}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);

  console.log(`\n🔍 Looking up company: ${companyName}`);

  // Find the company by name
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug")
    .ilike("name", companyName)
    .single();

  if (companyError || !company) {
    console.error(`❌ Company not found: ${companyName}`);
    if (companyError && companyError.code !== "PGRST116") {
      console.error(`   Error: ${companyError.message}`);
    }
    
    // List available companies
    const { data: companies } = await supabase
      .from("companies")
      .select("name")
      .order("name");
    
    if (companies && companies.length > 0) {
      console.log("\n📋 Available companies:");
      companies.forEach((c) => console.log(`   - ${c.name}`));
    }
    process.exit(1);
  }

  console.log(`✅ Found company: ${company.name} (slug: ${company.slug})`);

  // Check if user already has a role in this company
  const { data: existingAdmin, error: existingError } = await supabase
    .from("company_admins")
    .select("id, role")
    .eq("company_id", company.id)
    .eq("user_id", user.id)
    .single();

  if (existingAdmin) {
    // Update existing role
    console.log(`\n📝 User already has role "${existingAdmin.role}" in ${company.name}`);
    
    if (existingAdmin.role === normalizedRole) {
      console.log(`ℹ️  User is already ${normalizedRole}. No changes needed.`);
      process.exit(0);
    }

    console.log(`🔄 Updating role from "${existingAdmin.role}" to "${normalizedRole}"...`);

    const { error: updateError } = await supabase
      .from("company_admins")
      .update({ role: normalizedRole })
      .eq("id", existingAdmin.id);

    if (updateError) {
      console.error(`❌ Failed to update role: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Successfully updated ${user.email} to ${normalizedRole} of ${company.name}`);
  } else {
    // Create new company admin entry
    console.log(`\n➕ Adding user as ${normalizedRole} to ${company.name}...`);

    const { error: insertError } = await supabase
      .from("company_admins")
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: normalizedRole,
      });

    if (insertError) {
      console.error(`❌ Failed to add user to company: ${insertError.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Successfully added ${user.email} as ${normalizedRole} of ${company.name}`);
  }

  // Also update user's company_id if not set
  if (!user.company_id) {
    await supabase
      .from("users")
      .update({ company_id: company.id })
      .eq("id", user.id);
    console.log(`📎 Linked user to company ${company.name}`);
  }

  console.log("\n🎉 Done!\n");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});


// SUPABASE_SERVICE_ROLE_KEY="..." NEXT_PUBLIC_SUPABASE_URL="..." node scripts/promote-user.js areefsyed021@gmail.com "<company_name>" admin
// SUPABASE_SERVICE_ROLE_KEY="..." NEXT_PUBLIC_SUPABASE_URL="..." node scripts/promote-user.js areefsyed021@gmail.com "<company_name>" owner