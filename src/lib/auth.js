import jwt from 'jsonwebtoken';

export function getSessionUser(request) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}