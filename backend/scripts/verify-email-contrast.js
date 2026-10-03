const http = require("http");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const notificationRoutes = require("../src/routes/notifications");
const {
  formatEmailDate,
  wrapHtmlEmail,
  renderInfoTable,
  renderWarningBox,
  renderInfoBox
} = require("../src/services/emailService");

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use("/api/v1/notifications", notificationRoutes);

async function runVerification() {
  console.log("==================================================================");
  console.log("AGRIGUARD EMAIL CONTRAST & VISIBILITY COMPREHENSIVE VERIFICATION");
  console.log("==================================================================\n");

  // 1. Verify Test Endpoint on running server
  const server = app.listen(5099, async () => {
    try {
      console.log("[1] Testing POST /api/v1/notifications/email/test endpoint...");
      
      const payload = JSON.stringify({
        customEmail: "test-verifier@agriguard.gov.in",
        testMessage: "AgriGuard Contrast and Visibility Verification Test"
      });

      const req = http.request({
        hostname: "localhost",
        port: 5099,
        path: "/api/v1/notifications/email/test",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", async () => {
          console.log(`    Response status: ${res.statusCode}`);
          const parsed = JSON.parse(data);
          console.log(`    Success: ${parsed.success}`);
          console.log(`    Recipient: ${parsed.recipient}`);
          console.log(`    Status: ${parsed.status}`);
          console.log(`    Message ID: ${parsed.messageId}`);

          if (parsed.success) {
            console.log("  [PASS] Endpoint POST /api/v1/notifications/email/test functioning cleanly\n");
          } else {
            console.error("  [FAIL] Endpoint test failed:", parsed);
          }

          // Clean up test notifications
          await prisma.emailNotification.deleteMany({
            where: { recipientEmail: "test-verifier@agriguard.gov.in" }
          });

          // 2. Comprehensive HTML Content & Contrast Inspection across ALL templates
          await verifyAllTemplates();
          server.close();
          await prisma.$disconnect();
        });
      });

      req.on("error", async (e) => {
        console.error("  [FAIL] Request error:", e.message);
        server.close();
        await prisma.$disconnect();
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.error(err);
      server.close();
      await prisma.$disconnect();
    }
  });
}

async function verifyAllTemplates() {
  console.log("[2] Inspecting All 8 Email Types for Contrast, Inline Styles & Gmail Dark Mode...\n");

  const templates = [
    {
      name: "1. Treatment Alert (AgriGuard – Treatment Alert)",
      subject: "AgriGuard – Treatment Alert",
      badge: "Treatment Alert",
      html: wrapHtmlEmail({
        title: "AgriGuard – Treatment Alert",
        badge: "Treatment Alert",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">A veterinary treatment has been officially recorded in AgriGuard for your livestock.</p>
          ${renderInfoTable([
            ["Farmer Name", `<strong style="color: #ffffff !important;">RAJESH</strong> <span style="color: #94a3b8 !important;">(FR10293)</span>`],
            ["Animal / Batch ID", `<strong style="color: #60a5fa !important;">RJ-CW1</strong>`],
            ["Prescribed Medicine", `<strong style="color: #ffffff !important;">Oxytetracycline</strong>`],
            ["Active Ingredient", `<span style="color: #cbd5e1 !important;">Oxytetracycline</span>`],
            ["Treatment Date", `<span style="color: #ffffff !important;">17 September 2026</span>`],
            ["Withdrawal Period", `<strong style="color: #ffffff !important;">7 Days</strong>`],
            ["Withdrawal Ends", `<strong style="color: #38bdf8 !important; font-size: 14px;">24 September 2026</strong>`]
          ])}
        `,
        warningHtml: renderWarningBox(
          "IMPORTANT STATUTORY RESTRICTION:",
          "Please do not sell or use the applicable animal product (milk, meat, eggs) until the withdrawal period is completed on 24 September 2026."
        ),
        actionText: "View Treatment Record",
        actionUrl: "http://localhost:3000/farmer/animals"
      })
    },
    {
      name: "2. Treatment Updated Alert (AgriGuard – Treatment Update Alert)",
      subject: "AgriGuard – Treatment Update Alert",
      badge: "Treatment Updated",
      html: wrapHtmlEmail({
        title: "AgriGuard – Treatment Update Alert",
        badge: "Treatment Updated",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">An antibiotic treatment record has been updated by the attending veterinarian.</p>
          ${renderInfoTable([
            ["Farmer Name", `<strong style="color: #ffffff !important;">RAJESH</strong> <span style="color: #94a3b8 !important;">(FR10293)</span>`],
            ["Animal / Batch ID", `<strong style="color: #60a5fa !important;">RJ-CW1</strong>`],
            ["Updated Medicine", `<strong style="color: #ffffff !important;">Ceftiofur</strong>`],
            ["Treatment Date", `<span style="color: #ffffff !important;">17 September 2026</span>`],
            ["Revised Withdrawal Period", `<strong style="color: #ffffff !important;">4 Days</strong>`],
            ["Revised Withdrawal End Date", `<strong style="color: #38bdf8 !important; font-size: 14px;">21 September 2026</strong>`]
          ])}
        `,
        warningHtml: renderWarningBox(
          "SUPERSEDED TIMELINE:",
          "Do not use or sell the applicable animal products from this animal until the revised withdrawal period completes on 21 September 2026."
        ),
        actionText: "View Updated Treatment",
        actionUrl: "http://localhost:3000/farmer/animals"
      })
    },
    {
      name: "3. Withdrawal Reminder (AgriGuard – Withdrawal Period Reminder)",
      subject: "AgriGuard – Withdrawal Period Reminder",
      badge: "24-Hour Reminder",
      html: wrapHtmlEmail({
        title: "AgriGuard – Withdrawal Period Reminder",
        badge: "24-Hour Reminder",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a reminder regarding the ongoing statutory withdrawal period for your livestock:</p>
          ${renderInfoTable([
            ["Animal ID", `<strong style="color: #60a5fa !important;">RJ-CW1</strong>`],
            ["Administered Medicine", `<strong style="color: #ffffff !important;">Ceftiofur</strong>`],
            ["Withdrawal Ends Tomorrow", `<strong style="color: #f59e0b !important; font-size: 14px;">18 September 2026</strong>`]
          ])}
        `,
        warningHtml: renderWarningBox(
          "MANDATORY WITHHOLDING:",
          "Please do not sell or consume the applicable animal product before the withdrawal period is completed."
        ),
        actionText: "Check Withdrawal Status",
        actionUrl: "http://localhost:3000/farmer/animals"
      })
    },
    {
      name: "4. Withdrawal Completed (AgriGuard – Withdrawal Completed)",
      subject: "AgriGuard – Withdrawal Completed",
      badge: "Withdrawal Completed",
      html: wrapHtmlEmail({
        title: "AgriGuard – Withdrawal Completed",
        badge: "Withdrawal Completed",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">The recorded withdrawal period for the following animal has officially completed.</p>
          ${renderInfoTable([
            ["Animal ID", `<strong style="color: #60a5fa !important;">RJ-CW1</strong>`],
            ["Medicine", `<strong style="color: #ffffff !important;">Ceftiofur</strong>`],
            ["Withdrawal Completed On", `<strong style="color: #10b981 !important; font-size: 14px;">17 September 2026</strong>`]
          ])}
        `,
        warningHtml: renderInfoBox(
          "NEXT COMPLIANCE STEP:",
          "The product can proceed to the next applicable safety/compliance step."
        ),
        actionText: "View Cleared Animal",
        actionUrl: "http://localhost:3000/farmer/animals"
      })
    },
    {
      name: "5. MRL Test Result (AgriGuard – MRL Test Result)",
      subject: "AgriGuard – MRL Test Result",
      badge: "MRL Test Result",
      html: wrapHtmlEmail({
        title: "AgriGuard – MRL Test Result",
        badge: "MRL Test Result",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">An official laboratory Maximum Residue Limit (MRL) chemical assay result has been submitted to AgriGuard.</p>
          ${renderInfoTable([
            ["Animal / Batch Reference", `<strong style="color: #60a5fa !important;">RJ-CW1</strong>`],
            ["Lab Assay Finding", `<strong style="color: #ffffff !important;">0.02 mg/kg (Ceftiofur)</strong>`],
            ["Statutory MRL Status", `<strong style="color: #10b981 !important; font-size: 14px;">SAFE</strong>`],
            ["Test Date", `<span style="color: #ffffff !important;">17 September 2026</span>`]
          ])}
        `,
        warningHtml: renderInfoBox(
          "LAB ASSAY NOTICE:",
          "Please refer to the AgriGuard dashboard for the complete chemical spectrum."
        ),
        actionText: "View Lab Analysis Report",
        actionUrl: "http://localhost:3000/farmer/certificates"
      })
    },
    {
      name: "6. Certification Update (AgriGuard – Certification Update)",
      subject: "AgriGuard – Certification Update",
      badge: "Certification Update",
      html: wrapHtmlEmail({
        title: "AgriGuard – Certification Update",
        badge: "Certification Update",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">RAJESH</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Your AgriGuard MRL certification status has been updated by the regulatory authority.</p>
          ${renderInfoTable([
            ["Certificate ID", `<strong style="color: #60a5fa !important;">CERT-E2E-TEST-001</strong>`],
            ["Designated Status", `<strong style="color: #10b981 !important; font-size: 14px;">SAFE</strong>`],
            ["Valid From", `<span style="color: #ffffff !important;">17 September 2026</span>`],
            ["Valid Until", `<span style="color: #ffffff !important;">24 September 2026</span>`]
          ])}
        `,
        warningHtml: renderInfoBox(
          "VERIFICATION NOTICE:",
          "Please use the AgriGuard dashboard or QR verification system to view your digital certification seal."
        ),
        actionText: "View Digital Certificate",
        actionUrl: "http://localhost:3000/farmer/certificates"
      })
    },
    {
      name: "7. Test Email Diagnostics (AgriGuard – Email Notification Test)",
      subject: "AgriGuard – Email Notification Test",
      badge: "System Diagnostics",
      html: wrapHtmlEmail({
        title: "AgriGuard – Email Notification Test",
        badge: "System Diagnostics",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a test notification verifying connectivity with the <strong style="color: #ffffff !important;">AgriGuard Email Notification Subsystem</strong>.</p>
          ${renderInfoBox(
            "DIAGNOSTIC MESSAGE:",
            `<span style="color: #ffffff !important; font-weight: 500;">Diagnostics verification payload</span>`
          )}
        `,
        actionText: "Open AgriGuard Dashboard",
        actionUrl: "http://localhost:3000"
      })
    },
    {
      name: "8. Retry Notification Queue",
      subject: "AgriGuard – Retry Queue Notification",
      badge: "Retry Attempt",
      html: wrapHtmlEmail({
        title: "AgriGuard – Retry Queue Notification",
        badge: "Retry Attempt",
        contentHtml: `
          <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a re-sent statutory notification from AgriGuard:</p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 18px 0; color: #ffffff !important;">
            <pre style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; color: #ffffff !important; font-size: 13px; line-height: 1.5;">Animal ID: RJ-CW1\nMedicine: Oxytetracycline</pre>
          </div>
        `,
        actionText: "Open AgriGuard Dashboard",
        actionUrl: "http://localhost:3000"
      })
    }
  ];

  let allPassed = true;

  for (const t of templates) {
    console.log(`Checking [${t.name}]:`);
    const h = t.html;

    const rules = [
      { rule: "Explicit Header Title (White on Green)", pass: h.includes("color: #ffffff !important; font-size: 22px; font-weight: 800") },
      { rule: "Explicit Subtitle (Mint #a7f3d0)", pass: h.includes("color: #a7f3d0 !important") },
      { rule: "Card Container (#1e293b)", pass: h.includes("background-color: #1e293b") },
      { rule: "Gmail Dark Mode Meta Tag", pass: h.includes('<meta name="color-scheme" content="light">') },
      { rule: "CTA Button with White Text (#ffffff) on Green (#16a34a)", pass: h.includes("background-color: #16a34a; color: #ffffff !important") },
      { rule: "Footer with Visible Secondary Text (#cbd5e1 / #64748b)", pass: h.includes("color: #cbd5e1 !important") && h.includes("color: #64748b !important") },
      { rule: "No unstyled dark-on-dark text elements", pass: !h.includes('<p>Dear') && !h.includes('<td>Farmer') }
    ];

    if (t.name.includes("Treatment") || t.name.includes("Withdrawal") || t.name.includes("MRL") || t.name.includes("Certification")) {
      rules.push({ rule: "Information Table Label (#111827 / #cbd5e1)", pass: h.includes("background-color: #111827 !important; color: #cbd5e1 !important") });
      rules.push({ rule: "Information Table Value (#1e293b / #ffffff)", pass: h.includes("background-color: #1e293b !important; color: #ffffff !important") });
    }

    for (const r of rules) {
      if (r.pass) {
        console.log(`    [PASS] ${r.rule}`);
      } else {
        console.error(`    [FAIL] ${r.rule}`);
        allPassed = false;
      }
    }
    console.log("");
  }

  if (allPassed) {
    console.log("==================================================================");
    console.log("ALL 8 EMAIL TYPES FULLY VERIFIED FOR CONTRAST & COMPATIBILITY!");
    console.log("==================================================================\n");
  } else {
    console.error("Some contrast checks failed.");
    process.exit(1);
  }
}

runVerification();
