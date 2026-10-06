/**
 * Helper to determine the standalone public URL for sharing with School Principals.
 * Uses the official production Vercel domain: https://ptbb-paper-maker-v2.vercel.app/
 */
export const STANDALONE_APP_URL = 'https://ptbb-paper-maker-v2.vercel.app';

export function getAppPublicOrigin(): string {
  if (typeof window === 'undefined') {
    return STANDALONE_APP_URL;
  }

  const origin = window.location.origin;

  // If running directly on the production domain or custom Vercel domain
  if (origin && origin.includes('vercel.app')) {
    return origin.replace(/\/+$/, '');
  }

  // If inside Google AI Studio, Google domains, local dev, or dev containers,
  // ALWAYS return the clean official production Vercel URL.
  if (
    !origin ||
    origin.includes('aistudio.google.com') ||
    origin.includes('google.com') ||
    origin.includes('googleusercontent.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('ais-dev-') ||
    origin.includes('run.app')
  ) {
    return STANDALONE_APP_URL;
  }

  return origin.replace(/\/+$/, '') || STANDALONE_APP_URL;
}

export function getPrincipalPortalLink(username: string): string {
  const base = getAppPublicOrigin().replace(/\/+$/, '');
  return `${base}/?principal=${encodeURIComponent(username)}`;
}

export function getGeneralPortalLink(): string {
  return `${getAppPublicOrigin().replace(/\/+$/, '')}/`;
}

