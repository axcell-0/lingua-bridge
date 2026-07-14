import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import { isValidEmail } from '@/lib/validators';
import { sendVerificationEmail } from '@/lib/email';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = rateLimit(`signup:${ip}`, 3, 60_000);
    if (!allowed) {
      return Response.json({ error: 'Too many signup attempts. Please wait a moment.' }, { status: 429 });
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      verified: false,
      verificationCode: code,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationEmail(user.email, code);

    return Response.json({ message: 'Account created. Check your email for a verification code.', email: user.email }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}