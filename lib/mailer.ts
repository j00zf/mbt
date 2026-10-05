import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "beavertechindia@gmail.com";
const smtpPass = process.env.SMTP_PASS || "zkbaiskmypqauyir";
const mailFrom = process.env.MAIL_FROM_ADDRESS || "beavertechindia@gmail.com";

// Create reusable nodemailer transporter using Gmail SMTP
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export interface SendApplicationEmailParams {
  to: string;
  fullName: string;
  applicationId: number | string;
  schoolCode: string;
  schoolName: string;
  durationModel: string;
  roleTitle?: string | null;
  college?: string;
  degree?: string;
}

/**
 * Sends a confirmation email to the student applicant notifying them that their
 * application has been received and is under review.
 */
export async function sendApplicationConfirmationEmail(params: SendApplicationEmailParams) {
  const {
    to,
    fullName,
    applicationId,
    schoolCode,
    schoolName,
    durationModel,
    roleTitle,
    college,
    degree,
  } = params;

  const subject = `Application Received — MBT Internship Portal (#MBT-APP-${applicationId})`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px;">
                      Mission Better Tomorrow (MBT)
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; line-height: 1.25;">
                      Internship Application Received
                    </h1>
                    <p style="color: #d1fae5; font-size: 13px; margin: 6px 0 0 0;">
                      Empowering Youth through Structured Functional Disciplines
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 15px; margin: 0 0 16px 0; color: #1e293b;">
                Dear <strong>${fullName}</strong>,
              </p>

              <p style="font-size: 14px; margin: 0 0 20px 0; color: #475569; line-height: 1.6;">
                Thank you for applying to the <strong>Mission Better Tomorrow (MBT) Internship Portal</strong>. Your application has been successfully submitted and logged into our academic evaluation system.
              </p>

              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 600;">
                  📢 Application Status: <span style="color: #047857; text-decoration: underline;">Under Review</span>
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">
                  Our domain coordinators and mentors will review your credentials, profile, and statement of purpose. We will update you via this email once the review is completed.
                </p>
              </div>

              <!-- Application Summary Box -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Submission Details
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px; color: #64748b; width: 40%;">Reference Number:</td>
                  <td style="padding-top: 10px; color: #0f172a; font-weight: 700; font-family: monospace;">#MBT-APP-${applicationId}</td>
                </tr>
                ${roleTitle
      ? `<tr>
                  <td style="padding-top: 8px; color: #64748b;">Applied Position:</td>
                  <td style="padding-top: 8px; color: #0f172a; font-weight: 700;">${roleTitle}</td>
                </tr>`
      : ""
    }
                <tr>
                  <td style="padding-top: 8px; color: #64748b;">Domain / School:</td>
                  <td style="padding-top: 8px; color: #0f172a; font-weight: 600;">Domain ${schoolCode}: ${schoolName}</td>
                </tr>
                <tr>
                  <td style="padding-top: 8px; color: #64748b;">Internship Duration:</td>
                  <td style="padding-top: 8px; color: #0f172a; font-weight: 600;">${durationModel}</td>
                </tr>
                ${college
      ? `<tr>
                  <td style="padding-top: 8px; color: #64748b;">Institution:</td>
                  <td style="padding-top: 8px; color: #334155;">${college}${degree ? ` (${degree})` : ""}</td>
                </tr>`
      : ""
    }
              </table>

              <!-- Next Steps Roadmap -->
              <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                What to expect next:
              </h3>
              <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
                <li><strong>Application Screening:</strong> The committee reviews candidate backgrounds against open project briefs.</li>
                <li><strong>Interaction / Assessment:</strong> Shortlisted candidates may be invited for an online introductory interview.</li>
                <li><strong>Onboarding Notification:</strong> Final acceptance, project guide allocation, and start dates will be emailed.</li>
              </ol>

              <p style="font-size: 13px; margin: 0 0 24px 0; color: #64748b; line-height: 1.5;">
                If you have any questions or need to submit updated documents, please feel free to reply directly to this email at <a href="mailto:${mailFrom}" style="color: #059669; text-decoration: none; font-weight: 600;">${mailFrom}</a>.
              </p>

              <p style="font-size: 13px; margin: 0; color: #1e293b;">
                Best regards,<br />
                <strong>Admissions & Selection Committee</strong><br />
                <span style="color: #059669; font-weight: 600;">Mission Better Tomorrow (MBT)</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Mission Better Tomorrow (MBT). All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                This is an automated notification for your internship application reference #MBT-APP-${applicationId}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Dear ${fullName},

Thank you for applying to the Mission Better Tomorrow (MBT) Internship Portal!

Your application has been received and is currently under review by our admissions team. We will update you via email once the review is completed.

APPLICATION SUMMARY:
- Reference Number: #MBT-APP-${applicationId}
${roleTitle ? `- Applied Position: ${roleTitle}\n` : ""}- Domain: Domain ${schoolCode}: ${schoolName}
- Internship Duration: ${durationModel}
${college ? `- Institution: ${college} (${degree || ""})\n` : ""}- Status: Under Review

NEXT STEPS:
1. Application Screening & Profile Verification
2. Candidate Interaction / Interview for Shortlisted Profiles
3. Final Selection & Onboarding Notification

If you have questions, please reach out to beavertechindia@gmail.com.

Warm regards,
Mission Better Tomorrow (MBT) Internship Team
`;

  try {
    const info = await transporter.sendMail({
      from: `"Mission Better Tomorrow (MBT)" <${mailFrom}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log("Confirmation email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    console.error("Failed to send confirmation email via Nodemailer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
