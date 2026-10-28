type PasswordResetMail = {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

function resetBody({ fullName, resetUrl, expiresInMinutes }: PasswordResetMail) {
  return [
    `Hi ${fullName},`,
    "",
    "We received a request to reset your CampusFlow password.",
    `Open this link to choose a new one: ${resetUrl}`,
    "",
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

/**
 * Sends the password reset link. Uses the Resend REST API when RESEND_API_KEY is
 * configured, otherwise falls back to logging the link so the flow stays testable
 * in local development.
 */
export async function sendPasswordResetEmail(mail: PasswordResetMail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "CampusFlow <no-reply@campusflow.edu>";
  const text = resetBody(mail);

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[mail] RESEND_API_KEY is not configured, so the password reset email was not sent.",
      );
    } else {
      console.warn(`[mail] RESEND_API_KEY not set. Reset link for ${mail.to}: ${mail.resetUrl}`);
    }
    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: mail.to,
      subject: "Reset your CampusFlow password",
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the message with status ${response.status}`);
  }
  return { delivered: true };
}
