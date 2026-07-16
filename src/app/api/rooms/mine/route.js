import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  const session = getSessionUser(request);
  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await connectDB();
  const rooms = await Room.find({
    $or: [{ host: session.userId }, { 'participants.user': session.userId }],
  })
    .sort({ createdAt: -1 })
    .limit(20);

  return Response.json({ rooms });
}