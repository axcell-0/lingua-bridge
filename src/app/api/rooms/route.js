import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { getSessionUser } from '@/lib/auth';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0, I/1 — avoids confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await connectDB();

  // Make sure the code is actually unique before using it
  let code;
  let existing = true;
  while (existing) {
    code = generateRoomCode();
    existing = await Room.findOne({ code });
  }

  const room = await Room.create({
    code,
    host: session.userId,
    participants: [{ user: session.userId, role: 'host' }],
    status: 'waiting',
  });

  return Response.json({
    message: 'Room created.',
    room: { code: room.code, status: room.status },
  }, { status: 201 });
}