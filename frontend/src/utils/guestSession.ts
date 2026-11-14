/**
 * Helper to manage Guest session identities across games and screen displays.
 * Generates and preserves a persistent 4-character session tag per browser session,
 * e.g. "Guest_7B2D".
 */

export function getOrCreateGuestSessionId(): string {
  let id = sessionStorage.getItem('royal_chess_guest_session_id')
  if (!id) {
    id = Math.random().toString(36).substring(2, 6).toUpperCase()
    sessionStorage.setItem('royal_chess_guest_session_id', id)
  }
  return id
}

export function getGuestDisplayName(): string {
  return `Guest_${getOrCreateGuestSessionId()}`
}

