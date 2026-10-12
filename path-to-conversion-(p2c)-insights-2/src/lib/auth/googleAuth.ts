declare const google: any;

const SLIDES_SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
];

interface CachedToken {
  token: string;
  expiresAt: number;
}

let memoryToken: CachedToken | null = null;
let resolvedClientId: string | null = null;

/**
 * Fetch or detect the Google OAuth Client ID
 */
export async function getGoogleClientId(): Promise<string | null> {
  if (resolvedClientId) {
    return resolvedClientId;
  }

  // 1. Check Vite env variable
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_GOOGLE_CLIENT_ID && metaEnv.VITE_GOOGLE_CLIENT_ID.trim()) {
    resolvedClientId = metaEnv.VITE_GOOGLE_CLIENT_ID.trim();
    return resolvedClientId;
  }

  // 2. Check localStorage override
  try {
    const custom = localStorage.getItem('p2c_google_client_id');
    if (custom && custom.trim()) {
      resolvedClientId = custom.trim();
      return resolvedClientId;
    }
  } catch {
    // Ignore storage errors
  }

  // 3. Query server endpoint for configured client ID
  try {
    const res = await fetch('/api/auth/google-client-id');
    if (res.ok) {
      const data = await res.json();
      if (data.clientId && typeof data.clientId === 'string') {
        resolvedClientId = data.clientId.trim();
        return resolvedClientId;
      }
    }
  } catch {
    // Continue to fallback
  }

  // 4. Default provisioned OAuth client ID
  resolvedClientId = '202614726897-h3svssigtv87knedoj1inla5p4of1hv3.apps.googleusercontent.com';
  return resolvedClientId;
}

export function saveCustomClientId(id: string): void {
  try {
    localStorage.setItem('p2c_google_client_id', id);
    resolvedClientId = id;
    memoryToken = null;
  } catch (err) {
    console.warn('Failed to persist custom client ID:', err);
  }
}

/**
 * Validates if the cached access token is currently active
 */
export function getActiveAccessToken(): string | null {
  if (!memoryToken) return null;
  if (Date.now() >= memoryToken.expiresAt) {
    memoryToken = null;
    return null;
  }
  return memoryToken.token;
}

/**
 * Clears the stored OAuth access token (e.g. for re-authentication)
 */
export function clearCachedAccessToken(): void {
  memoryToken = null;
}

/**
 * Requests a Google OAuth access token via Google Identity Services
 */
export async function requestGoogleAccessToken(promptUser = false): Promise<string> {
  // Check in-memory cache first
  const active = getActiveAccessToken();
  if (active && !promptUser) {
    return active;
  }

  const clientId = await getGoogleClientId();
  if (!clientId) {
    throw new Error(
      'Google Client ID is missing. Please configure your Google OAuth Client ID in Settings or verify your environment.'
    );
  }

  if (typeof google === 'undefined' || !google.accounts?.oauth2) {
    throw new Error(
      'Google Identity Services SDK is not loaded. Please ensure you are online and refresh the application.'
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SLIDES_SCOPES.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            const errorDetails = tokenResponse.error_description || tokenResponse.error;
            if (tokenResponse.error === 'access_denied') {
              reject(new Error('Google Slides access was declined. Permission is required to create your report.'));
            } else {
              reject(new Error(`Google authorization error: ${errorDetails}`));
            }
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token received from Google.'));
            return;
          }

          const expiresInSec = Number(tokenResponse.expires_in) || 3600;
          // Buffer token expiry by 60 seconds
          memoryToken = {
            token: tokenResponse.access_token,
            expiresAt: Date.now() + (expiresInSec - 60) * 1000,
          };

          resolve(tokenResponse.access_token);
        },
      });

      tokenClient.requestAccessToken({
        prompt: promptUser ? 'consent' : '',
      });
    } catch (err: any) {
      reject(new Error(`Failed to initialize Google OAuth: ${err?.message || 'Unknown error'}`));
    }
  });
}
