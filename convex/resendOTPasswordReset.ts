import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";

declare const process: {
  env: Record<string, string | undefined>;
};

export const ResendOTPPasswordReset = Email({
  id: "resend-otp",
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15,

  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    const from = process.env.RESEND_FROM_EMAIL;

    if (!from) {
      throw new Error("RESEND_FROM_EMAIL is not configured.");
    }

    const resend = new Resend(provider.apiKey);

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your TeamStore password",
      text: `Your TeamStore password reset code is ${token}. This code expires in 15 minutes.`,
      html: `
        <p>Your TeamStore password reset code is:</p>
        <p style="font-size: 24px; font-weight: 700;">${token}</p>
        <p>This code expires in 15 minutes.</p>
      `,
    });

    if (error) {
      throw new Error(
        `Unable to send password reset email: ${error.message}`,
      );
    }
  },
});
