import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['host', 'guest'],
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    status: {
        type: String,
        enum: ['waiting', 'active', 'ended'],
        default: 'waiting'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);