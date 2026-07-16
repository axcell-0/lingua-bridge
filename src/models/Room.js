import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, default: null },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            role: { type: String, enum: ['host', 'guest'], required: true },
            joinedAt: { type: Date, default: Date.now },
        },
    ],
    status: { type: String, enum: ['scheduled', 'waiting', 'active', 'ended'], default: 'waiting' },
    scheduledFor: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);