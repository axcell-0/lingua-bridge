import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = rateLimit(`verify:${ip}`, 10, 60_000);
    if (!allowed) {
        return Response.json({ error: 'Too many attempts. Please wait a moment.' }, { status: 429 });
    }

    const { email, code } = await request.json();
    if (!email || !code) {
        return Response.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.verified) {
        return Response.json({ error: 'Incorect code.' }, { status: 400 });
    }
    if (user.vericationCodeExpires < new Date()) {
        return Response.json({ error: 'This code has expired. Request a new one.' }, { status: 410 });
    }

    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    return Response.json({ message: 'Email verified' });
}