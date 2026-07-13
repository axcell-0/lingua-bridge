export function isValidRoomCode(code) {
  return typeof code === 'string' && /^[A-Z2-9]{6}$/.test(code);
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}