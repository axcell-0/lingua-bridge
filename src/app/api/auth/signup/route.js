import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
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

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return Response.json({ message: 'Account created.', userId: user._id }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}