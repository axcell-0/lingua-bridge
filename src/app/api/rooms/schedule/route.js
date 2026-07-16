import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { getSessionUser } from '@/lib/auth';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { title, scheduledFor } = await request.json();
  const when = new Date(scheduledFor);

  if (!scheduledFor || isNaN(when.getTime()) || when <= new Date()) {
    return Response.json({ error: 'Please choose a valid future date and time.' }, { status: 400 });
  }
  if (title && title.length > 80) {
    return Response.json({ error: 'Title is too long.' }, { status: 400 });
  }

  await connectDB();

  let code;
  let existing = true;
  while (existing) {
    code = generateRoomCode();
    existing = await Room.findOne({ code });
  }

  const room = await Room.create({
    code,
    title: title?.trim() || null,
    host: session.userId,
    participants: [{ user: session.userId, role: 'host' }],
    status: 'scheduled',
    scheduledFor: when,
  });

  return Response.json({ message: 'Meeting scheduled.', room }, { status: 201 });
}