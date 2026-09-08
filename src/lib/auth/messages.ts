// ============================================================================
// What a failed sign-in says out loud.
//
// Supabase returns the same "Invalid login credentials" for a wrong password
// and an address that has never signed up, which is deliberate — telling them
// apart is an account-enumeration oracle. These strings keep that property
// while sounding like a person wrote them.
// ============================================================================

export function authErrorMessage(raw: string | undefined): string {
  if (!raw) return 'Something went wrong. Try again.'

  const message = raw.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'That email and password do not match an account.'
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox for the link.'
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'There is already an account with that email. Sign in instead.'
  }
  if (message.includes('password should be at least')) {
    return 'Use a password of at least 8 characters.'
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'That does not look like an email address.'
  }
  return 'Something went wrong. Try again.'
}
