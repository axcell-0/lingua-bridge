import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/github/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  response.cookies.set('oauth_state', state, { httpOnly: true, path: '/', maxAge: 300, sameSite: 'lax' });
  return response;
}