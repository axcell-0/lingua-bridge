import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { getSessionUser } from '@/lib/auth';
import { isValidRoomCode } from '@/lib/validators';

export async function GET(request, { params }) {
    const session = getSessionUser(request);
    if (!session) {
        return Response.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { code } = await params;
    if (!isValidRoomCode(code.toUpperCase())) {
        return Response.json({ error: 'Invalide room code format.' } , { status: 400 });
    }
    await connectDB();

    const room = await Room.findOne({ code: code.toUpperCase() })
    .populate('participants.user', 'name email'); // Populate user details

    if (!room) {
        return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    // The authorization check
    const isParticipant = room.participants.some(
        (p) => p.user._id.toString() === session.userId
    );

    if (!isParticipant) {
        return Response.json({ error: 'You do not have access to this room.' }, { status: 403 });
    }

    return Response.json({ room })
}