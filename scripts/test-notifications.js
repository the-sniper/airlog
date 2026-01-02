#!/usr/bin/env node

/**
 * Test script to create sample notifications
 * Run with: node scripts/test-notifications.js
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testNotifications() {
  console.log("🧪 Testing notification system...\n");

  try {
    const response = await fetch(`${baseUrl}/api/test/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Success!", data.message);
      console.log("\n📧 Check your email at: areefsyed96@gmail.com");
      console.log(
        "   - You should receive emails for critical and warning notifications"
      );
      console.log("\n🔔 Check the notification center in the admin dashboard");
      console.log("   - Click the bell icon in the sidebar");
      console.log("   - You should see 3 test notifications\n");
    } else {
      console.error("❌ Error:", data.error);
      if (response.status === 403) {
        console.log('\n💡 Make sure NODE_ENV is not set to "production"');
      }
    }
  } catch (error) {
    console.error("❌ Failed to create test notifications:", error.message);
    console.log("\n💡 Make sure the dev server is running: npm run dev");
  }
}

testNotifications();
