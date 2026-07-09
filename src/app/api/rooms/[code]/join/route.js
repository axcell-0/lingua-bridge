import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
    const session = getSessionUser(request);
    if (!session) {
        return Response.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { code } = await params;
    await connectDB();

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
        return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (room.status === 'ended') {
        return Response.json({ error: 'This room has ended' }, { status: 410 });
    }

    const alreadyIn = room.participants.some(
        (p) => p.user.toString() === session.userId
    );

    if (!alreadyIn) {
        // A simple two-person cap for now, can be expanded later
        if (room.participants.length >= 2) {
            return Response.json({ error: 'Room is full.' }, { status: 403 });
        }
        room.participants.push({ user: session.userId, role: 'guest' });
        room.status = 'active'; // Change status to active when a guest joins
        await room.save();
    }

    return Response.json({
        message: 'Joined room.',
        room: { code: room.code, status: room.status },
    }, { status: 200 });
}