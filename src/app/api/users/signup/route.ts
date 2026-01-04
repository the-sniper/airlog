import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  hashPassword,
  createUserToken,
  setUserAuthCookie,
} from "@/lib/user-auth";
import { generateInviteToken } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { first_name, last_name, email, password, company_id } = await req.json();

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const password_hash = await hashPassword(password);
    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password_hash,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    // If company_id is provided, create a join request
    let joinRequestCreated = false;
    if (company_id) {
      // Verify company exists and allows join requests
      const { data: company } = await supabase
        .from("companies")
        .select("id, name, allow_join_requests")
        .eq("id", company_id)
        .eq("is_active", true)
        .single();

      if (company && company.allow_join_requests) {
        const { error: joinError } = await supabase
          .from("company_join_requests")
          .insert({
            company_id: company_id,
            user_id: created.id,
            status: "pending",
          });

        if (!joinError) {
          joinRequestCreated = true;
        } else {
          console.error("[Signup] Error creating join request:", joinError);
        }
      }
    }

    // Link existing testers with same email to this user
    await supabase
      .from("testers")
      .update({ user_id: created.id })
      .eq("email", normalizedEmail)
      .is("user_id", null);

    // Also link team members with same email to this user
    await supabase
      .from("team_members")
      .update({ user_id: created.id })
      .eq("email", normalizedEmail)
      .is("user_id", null);

    // Claim pending invites for this email
    const { data: pendingInvites } = await supabase
      .from("pending_invites")
      .select("*")
      .eq("email", normalizedEmail)
      .is("claimed_at", null)
      .gt("expires_at", new Date().toISOString());

    if (pendingInvites && pendingInvites.length > 0) {
      let companyIdToAssociate: string | null = null;

      for (const invite of pendingInvites) {
        try {
          if (invite.invite_type === "session") {
            // Look up the session to get its company_id
            const { data: session } = await supabase
              .from("sessions")
              .select("company_id")
              .eq("id", invite.target_id)
              .single();

            if (session?.company_id) {
              companyIdToAssociate = session.company_id;
            }

            // Create tester record for the session
            await supabase.from("testers").insert({
              session_id: invite.target_id,
              user_id: created.id,
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              email: normalizedEmail,
              invite_token: generateInviteToken(),
            });
          } else if (invite.invite_type === "team") {
            // Look up the team to get its company_id
            const { data: team } = await supabase
              .from("teams")
              .select("company_id")
              .eq("id", invite.target_id)
              .single();

            if (team?.company_id) {
              companyIdToAssociate = team.company_id;
            }

            // Create team member record
            await supabase.from("team_members").insert({
              team_id: invite.target_id,
              user_id: created.id,
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              email: normalizedEmail,
            });
          }

          // Mark invite as claimed
          await supabase
            .from("pending_invites")
            .update({ claimed_at: new Date().toISOString() })
            .eq("id", invite.id);
        } catch (inviteError) {
          console.error("[Signup] Error claiming invite:", inviteError);
          // Continue with other invites even if one fails
        }
      }

      // If we found a company to associate, add the user to that company
      if (companyIdToAssociate) {
        try {
          // Update user's company_id and join_method
          await supabase
            .from("users")
            .update({ 
              company_id: companyIdToAssociate,
              join_method: 'invite'
            })
            .eq("id", created.id);

          // Delete any pending join request for this company since user is now approved via invite
          await supabase
            .from("company_join_requests")
            .delete()
            .eq("user_id", created.id)
            .eq("company_id", companyIdToAssociate);

          // If there was a join request being created for this same company, mark it as not needed
          if (company_id === companyIdToAssociate) {
            joinRequestCreated = false;
          }
        } catch (companyError) {
          console.error("[Signup] Error associating user with company:", companyError);
        }
      }
    }



    // Claim pending company invites (for direct company invites)
    const { data: companyInvites } = await supabase
      .from("company_user_invites")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    if (companyInvites && companyInvites.length > 0) {
      for (const invite of companyInvites) {
        // Mark invite as accepted
        await supabase
          .from("company_user_invites")
          .update({ status: "accepted" })
          .eq("id", invite.id);

        // Add user to company
        // If users have multiple invites, the last one processed wins (or we could prioritize)
        // Since session/team invites also set company_id, we just ensure they get into the company.
        
        // Update user's company_id and join_method
        await supabase
          .from("users")
          .update({ 
            company_id: invite.company_id,
            join_method: 'invite'
          })
          .eq("id", created.id);

        // Delete pending join requests
        await supabase
          .from("company_join_requests")
          .delete()
          .eq("user_id", created.id)
          .eq("company_id", invite.company_id);
      }
    }

    // Auto-login: create token and set auth cookie
    const token = await createUserToken(created.id);
    await setUserAuthCookie(token);

    return NextResponse.json({ 
      success: true,
      joinRequestCreated,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
