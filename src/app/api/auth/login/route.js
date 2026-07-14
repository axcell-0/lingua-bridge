import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';
import { UNSTABLE_REVALIDATE_RENAME_ERROR } from 'next/dist/lib/constants';

export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { allowed } = rateLimit(`login:${ip}`, 5, 60_000);

        if (!allowed) {
            return Response.json({ error: 'Too many login attempts, please wait a moment and try again.'}, { status: 429});
        }
        
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user.verified) {
            return Response.json({ error: 'Please verify your email'})
        }

        if (!user) {
            return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d'}
        );

        const response = Response.json({
            message: 'Logged in.',
            user: { id: user._id, name: user.name, email: user.email },
        });

        response.headers.set(
            'Set-Cookie',
            `session=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        );

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ error: 'Something went wrong.' }, {  status: 500 });
    }
}