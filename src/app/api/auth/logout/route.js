export async function POST(request) {
    const response = Response.json({ message: 'Logged out.' });
    response.headers.set(
        'Set-Cookie',
        'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    );
    return response;
}