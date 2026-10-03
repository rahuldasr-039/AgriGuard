const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatEmailDate(dateInput) {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Creates SMTP transporter or simulated demo logger if credentials are not provided.
 */
function getTransporter() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const secure = process.env.EMAIL_SECURE === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    return {
      isSimulated: true,
      sendMail: async (options) => {
        console.log("\n============================================================");
        console.log("   [EMAIL] AGRIGUARD EMAIL DISPATCH (DEV/SIMULATED MODE)");
        console.log("============================================================");
        console.log(`[TO]:      ${options.to}`);
        console.log(`[FROM]:    ${options.from || process.env.EMAIL_FROM || "AgriGuard <no-reply@agriguard.gov.in>"}`);
        console.log(`[SUBJECT]: ${options.subject}`);
        console.log("------------------------------------------------------------");
        console.log(options.text || options.html);
        console.log("============================================================\n");
        return {
          messageId: `<simulated-${Date.now()}@agriguard.local>`,
          response: "250 Simulated delivery ok"
        };
      }
    };
  }

  const transportOptions = {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  };

  if (host && host.includes("gmail")) {
    transportOptions.service = "gmail";
  }

  return nodemailer.createTransport(transportOptions);
}

/**
 * Renders an accessible, high-contrast information table with explicit inline colors on every cell.
 */
function renderInfoTable(rows) {
  const rowHtml = rows.map(([label, value, valueStyle]) => `
    <tr>
      <td class="label-cell" style="background-color: #111827 !important; color: #cbd5e1 !important; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #334155; border-right: 1px solid #334155; width: 40%; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${label}
      </td>
      <td class="value-cell" style="background-color: #1e293b !important; color: #ffffff !important; font-weight: 500; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #334155; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; ${valueStyle || ''}">
        ${value}
      </td>
    </tr>
  `).join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="details-table" style="width: 100%; border-collapse: collapse; margin: 18px 0; background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden;">
      <tbody>
        ${rowHtml}
      </tbody>
    </table>
  `;
}

/**
 * Renders a high-contrast warning banner (e.g. mandatory statutory withholding periods).
 */
function renderWarningBox(title, message) {
  return `
    <div class="warning-box" style="background-color: #450a0a; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 18px 0; color: #fecaca !important; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <strong style="color: #fee2e2 !important; display: block; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${title}
      </strong>
      <span style="color: #fecaca !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${message}
      </span>
    </div>
  `;
}

/**
 * Renders a high-contrast information banner (e.g. next compliance steps, MRL guidance).
 */
function renderInfoBox(title, message) {
  return `
    <div class="info-box" style="background-color: #0c2d48; border: 1px solid #0284c7; border-radius: 8px; padding: 16px; margin: 18px 0; color: #bae6fd !important; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${title ? `<strong style="color: #e0f2fe !important; display: block; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${title}</strong>` : ""}
      <span style="color: #bae6fd !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${message}
      </span>
    </div>
  `;
}

/**
 * Wraps HTML in an official, clean AgriGuard responsive container.
 * Features bulletproof table structure, inline text and background colors,
 * explicit contrast (WCAG AA), and full Gmail/Outlook dark-mode compatibility.
 */
function wrapHtmlEmail({ title, badge, contentHtml, warningHtml, actionUrl, actionText }) {
  let actionButtonHtml = "";
  if (actionUrl !== false) {
    const btnUrl = actionUrl || (process.env.FRONTEND_URL || "http://localhost:3000");
    const btnText = actionText || "View AgriGuard";
    actionButtonHtml = `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px 0;">
        <tr>
          <td align="left" style="background-color: #16a34a; border-radius: 8px;">
            <a href="${btnUrl}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff !important; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; border: 1px solid #15803d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              ${btnText}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse !important;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #0f172a !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    a {
      color: #ffffff !important;
      text-decoration: none;
    }
    a:visited {
      color: #ffffff !important;
    }
    .details-table {
      width: 100% !important;
      border-collapse: collapse !important;
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
    }
    .details-table td {
      padding: 12px 14px !important;
      font-size: 13px !important;
      border-bottom: 1px solid #334155 !important;
    }
    .details-table td.label-cell {
      background-color: #111827 !important;
      color: #cbd5e1 !important;
      font-weight: 600 !important;
      width: 40% !important;
    }
    .details-table td.value-cell {
      background-color: #1e293b !important;
      color: #ffffff !important;
      font-weight: 500 !important;
    }
    .warning-box {
      background-color: #450a0a !important;
      border: 1px solid #ef4444 !important;
      color: #fecaca !important;
    }
    .info-box {
      background-color: #0c2d48 !important;
      border: 1px solid #0284c7 !important;
      color: #bae6fd !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer presentation table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; width: 100% !important; margin: 0; padding: 24px 12px; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #0f172a; padding: 0;">
        <!-- Card Container Table (max 600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
          
          <!-- Header Banner with AgriGuard Brand -->
          <tr>
            <td align="center" style="background: #065f46; background-color: #065f46; background-image: linear-gradient(135deg, #065f46 0%, #0f766e 100%); padding: 26px 20px; text-align: center; border-bottom: 2px solid #047857;">
              <h1 style="margin: 0; color: #ffffff !important; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                AGRIGUARD
              </h1>
              <p style="margin: 6px 0 0 0; color: #a7f3d0 !important; font-size: 13px; font-weight: 500; letter-spacing: 0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Digital Farm Management &amp; Food Safety Platform
              </p>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 28px 24px; background-color: #1e293b; color: #ffffff; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              ${badge ? `
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: #0284c7; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  ${badge}
                </span>
              </div>` : ""}

              ${contentHtml}

              ${warningHtml || ""}

              ${actionButtonHtml}
            </td>
          </tr>

          <!-- Official Statutory Footer -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 20px 24px; text-align: center; font-size: 12px; line-height: 1.5; color: #94a3b8 !important; border-top: 1px solid #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin: 0 0 6px 0; color: #cbd5e1 !important; font-weight: 600; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                AgriGuard &ndash; Digital Farm Management System
              </p>
              <p style="margin: 0; color: #64748b !important; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Automated Statutory Notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Base email dispatch function with non-destructive error handling.
 */
async function sendEmail({ to, subject, text, html }) {
  if (!isValidEmail(to)) {
    console.warn(`[EMAIL] Skipped sending: invalid recipient email '${to}'`);
    return { success: false, error: `Invalid recipient email address: '${to}'` };
  }

  const from = process.env.EMAIL_FROM || "AgriGuard <no-reply@agriguard.gov.in>";
  const transporter = getTransporter();

  try {
    console.log(`[EMAIL] Dispatching email to: ${to} | Subject: "${subject}"`);
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    console.log(`[EMAIL] Email sent successfully. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (err) {
    let friendlyError = err.message;
    if (err.message && (err.message.includes("534") || err.message.includes("535") || err.message.includes("BadCredentials") || err.message.includes("Application-specific password") || err.message.includes("Username and Password not accepted"))) {
      friendlyError = "Google 2FA is enabled on rahuldas8akvotp@gmail.com. Google requires a 16-character Google App Password (not your regular account password) for SMTP. Please generate an App Password at https://myaccount.google.com/apppasswords and set it in backend/.env.";
      console.warn(`[EMAIL AUTH NOTICE] ${friendlyError}`);
    } else {
      console.error(`[EMAIL] Failed to send email to ${to}:`, err.message);
    }
    return {
      success: false,
      error: friendlyError
    };
  }
}

/**
 * 1. Treatment Created Email
 * Sent when a vet records an antibiotic treatment for an animal/flock.
 */
async function sendTreatmentCreatedEmail({
  treatmentId,
  tagId,
  medicineName,
  activeIngredient,
  dateAdministered,
  withdrawal,
  dose,
  doseUnit,
  weight
}) {
  try {
    console.log(`[EMAIL] Treatment notification triggered for treatmentId: ${treatmentId}`);
    const tag = await prisma.animalTag.findFirst({
      where: { OR: [{ id: tagId }, { tag: tagId }] },
      include: {
        animal: { include: { farm: { include: { farmer: { include: { user: true } } } } } },
        batch: { include: { farm: { include: { farmer: { include: { user: true } } } } } }
      }
    });

    if (!tag) {
      console.warn(`[EMAIL] Animal tag '${tagId}' not found in database. Skipped email.`);
      return { success: false, error: `Tag '${tagId}' not found` };
    }

    const farmer = tag.animal?.farm?.farmer || tag.batch?.farm?.farmer;
    if (!farmer) {
      console.warn(`[EMAIL] No linked farmer found for tag '${tag.tag}'. Skipped email.`);
      return { success: false, error: `No farmer found for tag '${tag.tag}'` };
    }

    if (farmer.emailNotificationsEnabled === false) {
      console.log(`[EMAIL] Notifications disabled by farmer '${farmer.fullName}' (${farmer.farmerId}). Skipping email.`);
      return { success: true, skipped: true, reason: "Notifications disabled by farmer" };
    }

    if (!farmer.notificationEmail || !isValidEmail(farmer.notificationEmail)) {
      console.log(`[EMAIL] Farmer notification email is not configured for farmer '${farmer.fullName}' (${farmer.farmerId}).`);
      return { success: false, skipped: true, error: "Farmer notification email is not configured" };
    }

    const recipientEmail = farmer.notificationEmail.trim();

    // Duplicate check
    const existing = await prisma.emailNotification.findFirst({
      where: {
        treatmentId,
        notificationType: "TREATMENT_CREATED",
        status: "SENT"
      }
    });
    if (existing) {
      console.log(`[EMAIL] Notification already sent for treatment '${treatmentId}', skipping duplicate.`);
      return { success: true, duplicate: true, notification: existing };
    }

    const farmerName = farmer.fullName || "Farmer";
    const animalId = tag.tag;
    const formattedTreatmentDate = formatEmailDate(dateAdministered || new Date());
    const withdrawalPeriod = withdrawal?.withdrawalPeriod || 7;
    const safeDate = withdrawal?.safeFromDate || new Date(Date.now() + withdrawalPeriod * 86400000);
    const formattedWithdrawalEndDate = formatEmailDate(safeDate);
    const animalWeight = weight || tag.animal?.weight || tag.batch?.avgWeight;

    const subject = "AgriGuard – Treatment Alert";

    const text = [
      `Dear ${farmerName},`,
      "",
      "A treatment has been recorded for your animal.",
      "",
      `Animal ID: ${animalId}`,
      `Medicine: ${medicineName}`,
      ...(animalWeight ? [`Current Weight: ${animalWeight} kg`] : []),
      ...(dose ? [`Prescribed Dose: ${dose} ${doseUnit || 'mg/kg'}`] : []),
      `Treatment Date: ${formattedTreatmentDate}`,
      `Withdrawal Ends: ${formattedWithdrawalEndDate}`,
      "",
      "IMPORTANT:",
      "Please do not sell or use the applicable animal product until the withdrawal period is completed.",
      "",
      "Please follow the applicable veterinary and food-safety requirements.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const tableRows = [
      ["Farmer Name", `<strong style="color: #ffffff !important;">${farmerName}</strong> <span style="color: #94a3b8 !important;">(${farmer.farmerId})</span>`],
      ["Animal / Batch ID", `<strong style="color: #60a5fa !important;">${animalId}</strong>`],
      ["Prescribed Medicine", `<strong style="color: #ffffff !important;">${medicineName}</strong>`],
      ["Active Ingredient", `<span style="color: #cbd5e1 !important;">${activeIngredient || medicineName}</span>`],
      ...(animalWeight ? [["Current Animal Weight", `<strong style="color: #ffffff !important;">${animalWeight} kg</strong>`]] : []),
      ...(dose ? [["Prescribed Dose", `<strong style="color: #34d399 !important;">${dose} ${doseUnit || 'mg/kg'}</strong>`]] : []),
      ["Treatment Date", `<span style="color: #ffffff !important;">${formattedTreatmentDate}</span>`],
      ["Withdrawal Period", `<strong style="color: #ffffff !important;">${withdrawalPeriod} Days</strong>`],
      ["Withdrawal Ends", `<strong style="color: #38bdf8 !important; font-size: 14px;">${formattedWithdrawalEndDate}</strong>`]
    ];

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${farmerName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">A veterinary treatment has been officially recorded in AgriGuard for your livestock.</p>
      ${renderInfoTable(tableRows)}
    `;

    const warningHtml = renderWarningBox(
      "IMPORTANT STATUTORY RESTRICTION:",
      `Please do not sell or use the applicable animal product (milk, meat, eggs) until the withdrawal period is completed on <strong style="color: #ffffff !important;">${formattedWithdrawalEndDate}</strong>.<br>Please follow the applicable veterinary and food-safety requirements.`
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "Treatment Alert",
      contentHtml,
      warningHtml,
      actionText: "View Treatment Record",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/animals"
    });

    const result = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId,
        farmerId: farmer.id,
        recipientEmail,
        subject,
        notificationType: "TREATMENT_CREATED",
        message: text,
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        failureReason: result.error || null,
        sentAt: result.success ? new Date() : null
      }
    });

    return { success: result.success, notification: notificationRecord, error: result.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendTreatmentCreatedEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Treatment Updated Email
 * Sent when a vet updates an existing antibiotic prescription.
 */
async function sendTreatmentUpdatedEmail({
  treatmentId,
  tagId,
  medicineName,
  dateAdministered,
  withdrawal
}) {
  try {
    console.log(`[EMAIL] Treatment update notification triggered for treatmentId: ${treatmentId}`);
    const tag = await prisma.animalTag.findFirst({
      where: { OR: [{ id: tagId }, { tag: tagId }] },
      include: {
        animal: { include: { farm: { include: { farmer: { include: { user: true } } } } } },
        batch: { include: { farm: { include: { farmer: { include: { user: true } } } } } }
      }
    });

    if (!tag) return { success: false, error: `Tag '${tagId}' not found` };
    const farmer = tag.animal?.farm?.farmer || tag.batch?.farm?.farmer;
    if (!farmer) return { success: false, error: "Farmer not found" };

    if (farmer.emailNotificationsEnabled === false) {
      console.log(`[EMAIL] Notifications disabled by farmer '${farmer.fullName}' (${farmer.farmerId}). Skipping email.`);
      return { success: true, skipped: true, reason: "Notifications disabled by farmer" };
    }

    if (!farmer.notificationEmail || !isValidEmail(farmer.notificationEmail)) {
      console.log(`[EMAIL] Farmer notification email is not configured for farmer '${farmer.fullName}' (${farmer.farmerId}).`);
      return { success: false, skipped: true, error: "Farmer notification email is not configured" };
    }

    const recipientEmail = farmer.notificationEmail.trim();

    const farmerName = farmer.fullName || "Farmer";
    const animalId = tag.tag;
    const formattedTreatmentDate = formatEmailDate(dateAdministered || new Date());
    const withdrawalPeriod = withdrawal?.withdrawalPeriod || 7;
    const safeDate = withdrawal?.safeFromDate || new Date(Date.now() + withdrawalPeriod * 86400000);
    const formattedWithdrawalEndDate = formatEmailDate(safeDate);

    const subject = "AgriGuard – Treatment Update Alert";

    const text = [
      `Dear ${farmerName},`,
      "",
      "An antibiotic treatment record has been updated by the attending veterinarian. The previous withdrawal timeline is superseded.",
      "",
      `Animal ID: ${animalId}`,
      `Medicine: ${medicineName}`,
      `Treatment Date: ${formattedTreatmentDate}`,
      `Withdrawal Period: ${withdrawalPeriod} Days`,
      `Withdrawal Ends: ${formattedWithdrawalEndDate}`,
      "",
      "IMPORTANT:",
      "Please do not sell or use the applicable animal product until the withdrawal period is completed.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${farmerName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">An antibiotic treatment record has been updated by the attending veterinarian. The previous withdrawal timeline is superseded.</p>
      ${renderInfoTable([
        ["Farmer Name", `<strong style="color: #ffffff !important;">${farmerName}</strong> <span style="color: #94a3b8 !important;">(${farmer.farmerId})</span>`],
        ["Animal / Batch ID", `<strong style="color: #60a5fa !important;">${animalId}</strong>`],
        ["Updated Medicine", `<strong style="color: #ffffff !important;">${medicineName}</strong>`],
        ["Treatment Date", `<span style="color: #ffffff !important;">${formattedTreatmentDate}</span>`],
        ["Revised Withdrawal Period", `<strong style="color: #ffffff !important;">${withdrawalPeriod} Days</strong>`],
        ["Revised Withdrawal End Date", `<strong style="color: #38bdf8 !important; font-size: 14px;">${formattedWithdrawalEndDate}</strong>`]
      ])}
    `;

    const warningHtml = renderWarningBox(
      "SUPERSEDED TIMELINE:",
      `Do not use or sell the applicable animal products from this animal until the revised withdrawal period completes on <strong style="color: #ffffff !important;">${formattedWithdrawalEndDate}</strong>.`
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "Treatment Updated",
      contentHtml,
      warningHtml,
      actionText: "View Updated Treatment",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/animals"
    });

    const result = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId,
        farmerId: farmer.id,
        recipientEmail,
        subject,
        notificationType: "TREATMENT_UPDATED",
        message: text,
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        failureReason: result.error || null,
        sentAt: result.success ? new Date() : null
      }
    });

    return { success: result.success, notification: notificationRecord, error: result.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendTreatmentUpdatedEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Resolves the farmer's active notification email and verifies if email notifications are enabled.
 * Strictly checks farmer.notificationEmail and farmer.emailNotificationsEnabled.
 * Does NOT fall back to user.email.
 */
async function resolveFarmerNotificationRecipient({ farmerId, fallbackEmail, fallbackName }) {
  let recipientEmail = fallbackEmail;
  let recipientName = fallbackName || "Farmer";
  let resolvedFarmerId = farmerId;

  if (farmerId) {
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId }
    });
    if (farmer) {
      recipientName = farmer.fullName || recipientName;
      resolvedFarmerId = farmer.id;

      if (farmer.emailNotificationsEnabled === false) {
        console.log(`[EMAIL] Notifications disabled by farmer '${farmer.fullName}' (${farmer.farmerId}). Skipping email.`);
        return { shouldSend: false, skipped: true, reason: "Notifications disabled by farmer" };
      }

      if (!farmer.notificationEmail || !isValidEmail(farmer.notificationEmail)) {
        console.log(`[EMAIL] Farmer notification email is not configured for farmer '${farmer.fullName}' (${farmer.farmerId}).`);
        return { shouldSend: false, skipped: true, error: "Farmer notification email is not configured" };
      }

      recipientEmail = farmer.notificationEmail.trim();
    }
  }

  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    console.log(`[EMAIL] Farmer notification email is not configured.`);
    return { shouldSend: false, skipped: true, error: "Farmer notification email is not configured" };
  }

  return {
    shouldSend: true,
    recipientEmail,
    recipientName,
    farmerId: resolvedFarmerId
  };
}

/**
 * 3. Withdrawal Reminder Email
 * Dispatched 24 hours prior to withdrawal expiration.
 */
async function sendWithdrawalReminderEmail({
  treatmentId,
  farmerName,
  farmerEmail,
  animalId,
  medicineName,
  withdrawalEndDate,
  farmerId
}) {
  try {
    console.log(`[EMAIL] Withdrawal reminder triggered for animal: ${animalId}`);
    const resolution = await resolveFarmerNotificationRecipient({
      farmerId,
      fallbackEmail: farmerEmail,
      fallbackName: farmerName
    });

    if (!resolution.shouldSend) {
      return { success: false, skipped: true, reason: resolution.reason, error: resolution.error };
    }

    const recipientEmail = resolution.recipientEmail;
    const recipientName = resolution.recipientName;
    const resolvedFarmerId = resolution.farmerId;

    const formattedEndDate = formatEmailDate(withdrawalEndDate);
    const subject = "AgriGuard – Withdrawal Period Reminder";

    const text = [
      `Dear ${recipientName},`,
      "",
      "This is a reminder regarding the withdrawal period for:",
      "",
      `Animal ID: ${animalId}`,
      `Medicine: ${medicineName}`,
      "",
      "Withdrawal period ends:",
      `${formattedEndDate}`,
      "",
      "Please do not sell the applicable animal product before the withdrawal period is completed.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a reminder regarding the ongoing statutory withdrawal period for your livestock:</p>
      ${renderInfoTable([
        ["Animal ID", `<strong style="color: #60a5fa !important;">${animalId}</strong>`],
        ["Administered Medicine", `<strong style="color: #ffffff !important;">${medicineName}</strong>`],
        ["Withdrawal Ends Tomorrow", `<strong style="color: #f59e0b !important; font-size: 14px;">${formattedEndDate}</strong>`]
      ])}
    `;

    const warningHtml = renderWarningBox(
      "MANDATORY WITHHOLDING:",
      "Please do not sell or consume the applicable animal product before the withdrawal period is completed."
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "24-Hour Reminder",
      contentHtml,
      warningHtml,
      actionText: "Check Withdrawal Status",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/animals"
    });

    const result = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId: treatmentId || null,
        farmerId: resolvedFarmerId || null,
        recipientEmail,
        subject,
        notificationType: "WITHDRAWAL_REMINDER",
        message: text,
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        failureReason: result.error || null,
        sentAt: result.success ? new Date() : null
      }
    });

    return { success: result.success, notification: notificationRecord, error: result.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendWithdrawalReminderEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 4. Withdrawal Completed Email
 * Dispatched on the day the withdrawal period has elapsed.
 */
async function sendWithdrawalCompletedEmail({
  treatmentId,
  farmerName,
  farmerEmail,
  animalId,
  medicineName,
  withdrawalEndDate,
  farmerId
}) {
  try {
    console.log(`[EMAIL] Withdrawal completion notification triggered for animal: ${animalId}`);
    const resolution = await resolveFarmerNotificationRecipient({
      farmerId,
      fallbackEmail: farmerEmail,
      fallbackName: farmerName
    });

    if (!resolution.shouldSend) {
      return { success: false, skipped: true, reason: resolution.reason, error: resolution.error };
    }

    const recipientEmail = resolution.recipientEmail;
    const recipientName = resolution.recipientName;
    const resolvedFarmerId = resolution.farmerId;

    const formattedEndDate = formatEmailDate(withdrawalEndDate);
    const subject = "AgriGuard – Withdrawal Completed";

    const text = [
      `Dear ${recipientName},`,
      "",
      "The recorded withdrawal period for the following animal has been completed.",
      "",
      `Animal ID: ${animalId}`,
      `Medicine: ${medicineName}`,
      `Withdrawal Completed: ${formattedEndDate}`,
      "",
      "The product can proceed to the next applicable safety/compliance step.",
      "",
      "Please continue to follow applicable MRL and food-safety requirements.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">The recorded withdrawal period for the following animal has officially completed.</p>
      ${renderInfoTable([
        ["Animal ID", `<strong style="color: #60a5fa !important;">${animalId}</strong>`],
        ["Medicine", `<strong style="color: #ffffff !important;">${medicineName}</strong>`],
        ["Withdrawal Completed On", `<strong style="color: #10b981 !important; font-size: 14px;">${formattedEndDate}</strong>`]
      ])}
    `;

    const warningHtml = renderInfoBox(
      "NEXT COMPLIANCE STEP:",
      `The product can proceed to the next applicable safety/compliance step.<br>Please continue to follow applicable MRL and food-safety requirements. Note that withdrawal completion does not automatically waive any mandated MRL testing or FSSAI verification.`
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "Withdrawal Completed",
      contentHtml,
      warningHtml,
      actionText: "View Cleared Animal",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/animals"
    });

    const result = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId: treatmentId || null,
        farmerId: resolvedFarmerId || null,
        recipientEmail,
        subject,
        notificationType: "WITHDRAWAL_COMPLETED",
        message: text,
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.messageId || null,
        failureReason: result.error || null,
        sentAt: result.success ? new Date() : null
      }
    });

    return { success: result.success, notification: notificationRecord, error: result.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendWithdrawalCompletedEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 5. MRL Test Result Email
 * Dispatched when a laboratory records an MRL assay test result.
 */
async function sendMRLResultEmail({
  farmerName,
  farmerEmail,
  animalOrBatchId,
  result,
  mrlStatus,
  testDate,
  farmerId
}) {
  try {
    console.log(`[EMAIL] MRL result notification triggered for: ${animalOrBatchId}`);
    const resolution = await resolveFarmerNotificationRecipient({
      farmerId,
      fallbackEmail: farmerEmail,
      fallbackName: farmerName
    });

    if (!resolution.shouldSend) {
      return { success: false, skipped: true, reason: resolution.reason, error: resolution.error };
    }

    const recipientEmail = resolution.recipientEmail;
    const recipientName = resolution.recipientName;
    const resolvedFarmerId = resolution.farmerId;

    const formattedTestDate = formatEmailDate(testDate || new Date());
    const subject = "AgriGuard – MRL Test Result";

    const text = [
      `Dear ${recipientName},`,
      "",
      "An MRL test result has been recorded in AgriGuard.",
      "",
      `Animal/Batch: ${animalOrBatchId}`,
      `Result: ${result}`,
      `MRL Status: ${mrlStatus}`,
      `Test Date: ${formattedTestDate}`,
      "",
      "Please refer to the AgriGuard dashboard for the complete test details.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const statusColor = mrlStatus === "PASSED" || mrlStatus === "SAFE" ? "#10b981" : "#ef4444";

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">An official laboratory Maximum Residue Limit (MRL) chemical assay result has been submitted to AgriGuard.</p>
      ${renderInfoTable([
        ["Animal / Batch Reference", `<strong style="color: #60a5fa !important;">${animalOrBatchId}</strong>`],
        ["Lab Assay Finding", `<strong style="color: #ffffff !important;">${result}</strong>`],
        ["Statutory MRL Status", `<strong style="color: ${statusColor} !important; font-size: 14px;">${mrlStatus}</strong>`],
        ["Test Date", `<span style="color: #ffffff !important;">${formattedTestDate}</span>`]
      ])}
    `;

    const warningHtml = renderInfoBox(
      "LAB ASSAY NOTICE:",
      "Please refer to the AgriGuard dashboard for the complete chemical spectrum, mass spectrometry details, and statutory clearance status."
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "MRL Test Result",
      contentHtml,
      warningHtml,
      actionText: "View Lab Analysis Report",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/certificates"
    });

    const sendRes = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId: null,
        farmerId: resolvedFarmerId || null,
        recipientEmail,
        subject,
        notificationType: "MRL_RESULT",
        message: text,
        status: sendRes.success ? "SENT" : "FAILED",
        providerMessageId: sendRes.messageId || null,
        failureReason: sendRes.error || null,
        sentAt: sendRes.success ? new Date() : null
      }
    });

    return { success: sendRes.success, notification: notificationRecord, error: sendRes.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendMRLResultEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 6. Certification Update Email
 * Dispatched when regulator updates weekly MRL certification status.
 */
async function sendCertificationUpdateEmail({
  farmerName,
  farmerEmail,
  mrlStatus,
  validFrom,
  validUntil,
  certificateId,
  farmerId
}) {
  try {
    console.log(`[EMAIL] Certification notification triggered for certificateId: ${certificateId}`);
    const resolution = await resolveFarmerNotificationRecipient({
      farmerId,
      fallbackEmail: farmerEmail,
      fallbackName: farmerName
    });

    if (!resolution.shouldSend) {
      return { success: false, skipped: true, reason: resolution.reason, error: resolution.error };
    }

    const recipientEmail = resolution.recipientEmail;
    const recipientName = resolution.recipientName;
    const resolvedFarmerId = resolution.farmerId;

    const formattedValidFrom = formatEmailDate(validFrom);
    const formattedValidUntil = formatEmailDate(validUntil);
    const subject = "AgriGuard – Certification Update";

    const text = [
      `Dear ${recipientName},`,
      "",
      "Your AgriGuard MRL certification status has been updated.",
      "",
      `Status: ${mrlStatus}`,
      `Valid From: ${formattedValidFrom}`,
      `Valid Until: ${formattedValidUntil}`,
      `Certificate ID: ${certificateId}`,
      "",
      "Please use the AgriGuard dashboard or QR verification system to view the current certification details.",
      "",
      "Regards,",
      "AgriGuard"
    ].join("\n");

    const statusColor = mrlStatus === "SAFE" ? "#10b981" : "#ef4444";

    const contentHtml = `
      <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Dear <strong style="color: #ffffff !important;">${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #e2e8f0 !important; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Your AgriGuard MRL certification status has been updated by the regulatory authority.</p>
      ${renderInfoTable([
        ["Certificate ID", `<strong style="color: #60a5fa !important;">${certificateId}</strong>`],
        ["Designated Status", `<strong style="color: ${statusColor} !important; font-size: 14px;">${mrlStatus}</strong>`],
        ["Valid From", `<span style="color: #ffffff !important;">${formattedValidFrom}</span>`],
        ["Valid Until", `<span style="color: #ffffff !important;">${formattedValidUntil}</span>`]
      ])}
    `;

    const warningHtml = renderInfoBox(
      "VERIFICATION NOTICE:",
      "Please use the AgriGuard dashboard or QR verification system to view your digital certification seal, blockchain proof, and premium market access eligibility."
    );

    const html = wrapHtmlEmail({
      title: subject,
      badge: "Certification Update",
      contentHtml,
      warningHtml,
      actionText: "View Digital Certificate",
      actionUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/farmer/certificates"
    });

    const sendRes = await sendEmail({ to: recipientEmail, subject, text, html });

    const notificationRecord = await prisma.emailNotification.create({
      data: {
        treatmentId: null,
        farmerId: resolvedFarmerId || null,
        recipientEmail,
        subject,
        notificationType: "CERTIFICATION_UPDATE",
        message: text,
        status: sendRes.success ? "SENT" : "FAILED",
        providerMessageId: sendRes.messageId || null,
        failureReason: sendRes.error || null,
        sentAt: sendRes.success ? new Date() : null
      }
    });

    return { success: sendRes.success, notification: notificationRecord, error: sendRes.error };
  } catch (err) {
    console.error("[EMAIL] Unexpected error in sendCertificationUpdateEmail:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 7. Test Email Dispatch (Development & Diagnostics)
 */
async function sendTestEmail({ customEmail, testMessage }) {
  const recipient = customEmail || process.env.EMAIL_USER;
  if (!isValidEmail(recipient)) {
    throw new Error(`Invalid email address '${recipient}'. Please specify a valid recipient email.`);
  }

  const subject = "AgriGuard – Email Notification Test";
  const bodyText = testMessage || "This is a test notification from the AgriGuard Email Notification Service.";

  const text = [
    "AGRIGUARD EMAIL TEST",
    "",
    `Recipient: ${recipient}`,
    "",
    bodyText,
    "",
    "Regards,",
    "AgriGuard Team"
  ].join("\n");

  const contentHtml = `
    <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a test notification verifying connectivity with the <strong style="color: #ffffff !important;">AgriGuard Email Notification Subsystem</strong>.</p>
    ${renderInfoBox(
      "DIAGNOSTIC MESSAGE:",
      `<span style="color: #ffffff !important; font-weight: 500;">${bodyText}</span>`
    )}
  `;

  const html = wrapHtmlEmail({
    title: subject,
    badge: "System Diagnostics",
    contentHtml,
    actionText: "Open AgriGuard Dashboard",
    actionUrl: process.env.FRONTEND_URL || "http://localhost:3000"
  });

  const sendRes = await sendEmail({ to: recipient, subject, text, html });

  const record = await prisma.emailNotification.create({
    data: {
      treatmentId: null,
      farmerId: null,
      recipientEmail: recipient,
      subject,
      notificationType: "TEST_EMAIL",
      message: text,
      status: sendRes.success ? "SENT" : "FAILED",
      providerMessageId: sendRes.messageId || null,
      failureReason: sendRes.error || null,
      sentAt: sendRes.success ? new Date() : null
    }
  });

  return {
    success: sendRes.success,
    recipient,
    messageId: sendRes.messageId,
    status: sendRes.success ? "SENT" : "FAILED",
    notification: record,
    error: sendRes.error
  };
}

/**
 * 8. Background Withdrawal Reminder & Completion Sweep
 * Run periodically by the background scheduler to evaluate:
 * - 24-hour upcoming withdrawal endings
 * - Completed withdrawal dates
 */
async function processScheduledEmailNotifications() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const results = {
    remindersSent: 0,
    completionsSent: 0,
    errors: []
  };

  try {
    const activeWithdrawals = await prisma.withdrawalRecord.findMany({
      include: {
        treatment: {
          include: {
            tag: {
              include: {
                animal: { include: { farm: { include: { farmer: { include: { user: true } } } } } },
                batch: { include: { farm: { include: { farmer: { include: { user: true } } } } } }
              }
            },
            emailNotifications: true
          }
        }
      }
    });

    for (const w of activeWithdrawals) {
      const treatment = w.treatment;
      if (!treatment) continue;

      const farmer = treatment.tag?.animal?.farm?.farmer || treatment.tag?.batch?.farm?.farmer;
      if (!farmer) continue;

      if (farmer.emailNotificationsEnabled === false) {
        console.log(`[EMAIL] Notifications disabled by farmer '${farmer.fullName}' (${farmer.farmerId}). Skipping scheduled notifications.`);
        continue;
      }

      if (!farmer.notificationEmail || !isValidEmail(farmer.notificationEmail)) {
        console.log(`[EMAIL] Farmer notification email is not configured for farmer '${farmer.fullName}' (${farmer.farmerId}).`);
        continue;
      }

      const recipientEmail = farmer.notificationEmail.trim();

      const safeFrom = new Date(w.safeFromDate);
      const animalTag = treatment.tag?.tag || "Animal";

      // A. Withdrawal Completion (safeFromDate <= now)
      if (now >= safeFrom) {
        const alreadySent = treatment.emailNotifications?.some(
          n => n.notificationType === "WITHDRAWAL_COMPLETED" && n.status === "SENT"
        );

        if (!alreadySent) {
          const res = await sendWithdrawalCompletedEmail({
            treatmentId: treatment.id,
            farmerName: farmer.fullName,
            farmerEmail: recipientEmail,
            animalId: animalTag,
            medicineName: treatment.medicineName,
            withdrawalEndDate: safeFrom,
            farmerId: farmer.id
          });

          if (res.success) {
            results.completionsSent++;
            // Update treatment status to SAFE
            await prisma.treatment.update({
              where: { id: treatment.id },
              data: { status: "SAFE" }
            });
          } else {
            results.errors.push(`Completion failed for treatment ${treatment.id}: ${res.error}`);
          }
        }
      }
      // B. 24-Hour Reminder (now < safeFromDate <= tomorrow)
      else if (safeFrom <= tomorrow && safeFrom > now) {
        const alreadySent = treatment.emailNotifications?.some(
          n => n.notificationType === "WITHDRAWAL_REMINDER" && n.status === "SENT"
        );

        if (!alreadySent) {
          const res = await sendWithdrawalReminderEmail({
            treatmentId: treatment.id,
            farmerName: farmer.fullName,
            farmerEmail: recipientEmail,
            animalId: animalTag,
            medicineName: treatment.medicineName,
            withdrawalEndDate: safeFrom,
            farmerId: farmer.id
          });

          if (res.success) {
            results.remindersSent++;
          } else {
            results.errors.push(`Reminder failed for treatment ${treatment.id}: ${res.error}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[EMAIL] Error in processScheduledEmailNotifications:", err.message);
    results.errors.push(err.message);
  }

  return results;
}

/**
 * 9. Retry a failed email notification
 */
async function retryEmailNotification(notificationId) {
  const notif = await prisma.emailNotification.findUnique({
    where: { id: notificationId }
  });

  if (!notif) throw new Error(`Notification '${notificationId}' not found`);
  if (!isValidEmail(notif.recipientEmail)) throw new Error("Invalid recipient email");

  const sendRes = await sendEmail({
    to: notif.recipientEmail,
    subject: notif.subject,
    text: notif.message,
    html: wrapHtmlEmail({
      title: notif.subject,
      badge: "Retry Attempt",
      contentHtml: `
        <p style="margin: 0 0 14px 0; color: #ffffff !important; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">This is a re-sent statutory notification from AgriGuard:</p>
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 18px 0; color: #ffffff !important;">
          <pre style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; color: #ffffff !important; font-size: 13px; line-height: 1.5;">${notif.message}</pre>
        </div>
      `,
      actionText: "Open AgriGuard Dashboard",
      actionUrl: process.env.FRONTEND_URL || "http://localhost:3000"
    })
  });

  const updated = await prisma.emailNotification.update({
    where: { id: notificationId },
    data: {
      status: sendRes.success ? "SENT" : "FAILED",
      providerMessageId: sendRes.messageId || notif.providerMessageId,
      failureReason: sendRes.error || null,
      sentAt: sendRes.success ? new Date() : notif.sentAt,
      retryCount: { increment: 1 }
    }
  });

  return { success: sendRes.success, notification: updated, error: sendRes.error };
}

module.exports = {
  formatEmailDate,
  isValidEmail,
  sendEmail,
  sendTreatmentCreatedEmail,
  sendTreatmentUpdatedEmail,
  sendWithdrawalReminderEmail,
  sendWithdrawalCompletedEmail,
  sendMRLResultEmail,
  sendCertificationUpdateEmail,
  sendTestEmail,
  processScheduledEmailNotifications,
  retryEmailNotification,
  wrapHtmlEmail,
  renderInfoTable,
  renderWarningBox,
  renderInfoBox
};
