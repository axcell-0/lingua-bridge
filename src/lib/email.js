import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, code) {
    await resend.emails.send({
        from: 'LinguaBridge <onboarding@resend.dev>',
        to: toEmail,
        subject: 'Your LinguaBridge verification code',
        html: `
        <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color: #0f172a;">Verify your email</h2>
        <p> Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0d9488;">${code}</p>
        <p style="color: #64748b; font-size: 13px;">This code espires in 10 minutes.</p>
        </div>
        `,
    });
}