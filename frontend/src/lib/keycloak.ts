import Keycloak from 'keycloak-js';

// Keycloak configuration - reads from environment or uses defaults
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.dvhub.tech',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'devhub',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'devhub-frontend',
};

let keycloakInstance: Keycloak | null = null;

export function getKeycloak(): Keycloak {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
}

export function isKeycloakEnabled(): boolean {
  return !!(import.meta.env.VITE_KEYCLOAK_URL);
}

/**
 * Initialize Keycloak silently (check-sso) without redirecting.
 * Returns true if user is already authenticated via Keycloak.
 */
export async function initKeycloakSilent(): Promise<boolean> {
  if (!isKeycloakEnabled()) return false;

  const kc = getKeycloak();
  try {
    const authenticated = await kc.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      checkLoginIframe: false,
    });
    return authenticated;
  } catch (error) {
    console.warn('[keycloak] Silent init failed:', error);
    return false;
  }
}

/**
 * Trigger Keycloak login redirect with custom UI bypass.
 * After successful login, Keycloak redirects back to the app.
 */
export async function keycloakLogin(): Promise<void> {
  const kc = getKeycloak();

  if (!kc.authenticated) {
    await kc.init({ onLoad: 'check-sso', checkLoginIframe: false });
  }

  await kc.login({
    redirectUri: `${window.location.origin}/auth?mode=keycloak-callback`,
  });
}

/**
 * Trigger Keycloak registration redirect.
 */
export async function keycloakRegister(): Promise<void> {
  const kc = getKeycloak();

  if (!kc.authenticated) {
    await kc.init({ onLoad: 'check-sso', checkLoginIframe: false });
  }

  await kc.register({
    redirectUri: `${window.location.origin}/auth?mode=keycloak-callback`,
  });
}

/**
 * Exchange Keycloak token for a DevHub backend token.
 */
export async function exchangeKeycloakToken(apiClient: any): Promise<{ token: string; user: any } | null> {
  const kc = getKeycloak();
  if (!kc.authenticated || !kc.token) return null;

  try {
    const response = await apiClient.post('/auth/keycloak/exchange', {
      keycloak_token: kc.token,
      keycloak_refresh_token: kc.refreshToken,
    });
    return response.data;
  } catch (error) {
    console.error('[keycloak] Token exchange failed:', error);
    return null;
  }
}

export { keycloakConfig };
