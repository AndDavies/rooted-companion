import crypto from 'crypto'

export function generateCodeVerifier(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let verifier = ''
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return verifier
}

export function generateCodeChallenge(verifier: string) {
  const hash = crypto.createHash('sha256').update(verifier).digest()
  return hash
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function generateState(length = 16) {
  return crypto.randomBytes(length).toString('hex')
} 