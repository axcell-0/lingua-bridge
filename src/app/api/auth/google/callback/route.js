import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = request.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token from Google');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    await connectDB();
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name || 'Google User',
        email: profile.email.toLowerCase(),
        oauthProvider: 'google',
        oauthId: profile.id,
        verified: true, // Google already verified this email for us
      });
    } else if (!user.oauthProvider) {
      user.oauthProvider = 'google';
      user.oauthId = profile.id;
      user.verified = true;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const response = NextResponse.redirect(`${url.origin}/`);
    response.cookies.set('session', token, {
      httpOnly: true, path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.delete('oauth_state');
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }
}