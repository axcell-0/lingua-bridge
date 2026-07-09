import { getSessionUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  const session = getSessionUser(request);

  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.userId).select('-password');

  if (!user) {
    return Response.json({ error: 'User no longer exists.' }, { status: 404 });
  }

  return Response.json({ user });
}