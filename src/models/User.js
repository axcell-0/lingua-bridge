import { verify } from 'jsonwebtoken';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () { return !this.oauthProvider; },
    },
    oauthProvider: {
        type: String,
        enum: ['google', 'github', null],
        default: null
    },
    oauthId: {
        type: String,
        default: null
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpires: {
        type: Date,
        default: null
    },
    createdat: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);