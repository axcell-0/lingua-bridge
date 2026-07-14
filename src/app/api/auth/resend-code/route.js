import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";
import { connect } from "mongoose";

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = rateLimit(`resend:${ip}`, 3, 60_000);
    if (!allowed) {
        return Response.json({ error: 'Too many request. please wait a moment.' }, { status: 429 });
    }

    const { email } = await request.json();
    await connectDB();
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user || user.verified) {
        return Response.json({ message: 'If an account exist, a new code has been sent.' });
    }

    const code = generateCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(user.email, code);

    return Response.json({ message: 'If an account exists, a new code has been sent.' });
}