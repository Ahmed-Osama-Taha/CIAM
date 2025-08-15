import Keycloak from 'keycloak-js';

// Create a single instance and store it globally to prevent re-initialization
let _kc = null;

const getKeycloakInstance = () => {
  if (!_kc) {
    _kc = new Keycloak({
      url: import.meta.env.VITE_SSO_AUTH_SERVER_URL,
      realm: import.meta.env.VITE_SSO_REALM,
      clientId: import.meta.env.VITE_SSO_CLIENT_ID,
    });
  }
  return _kc;
};

const loginOptions = {
  redirectUri: import.meta.env.VITE_SSO_REDIRECT_URI,
  idpHint: '',
};

export const initializeKeycloak = async () => {
  try {
    const kc = getKeycloakInstance();
    
    // Check if already initialized
    if (kc.authenticated !== undefined) {
      console.log('Keycloak already initialized, returning existing instance');
      return kc;
    }

    kc.onTokenExpired = () => {
      kc
        .updateToken(5)
        .then(function (refreshed) {
          if (refreshed) {
            console.log('Token was successfully refreshed');
          } else {
            console.log('Token is still valid');
          }
        })
        .catch(function () {
          console.log('Failed to refresh the token, or the session has expired');
        });
    };

    // Polyfill crypto.randomUUID for HTTP environments
    if (!window.crypto?.randomUUID) {
      window.crypto = window.crypto || {};
      window.crypto.randomUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
    }

    // For HTTP environments, use login-required to avoid check-sso issues
    const initOptions = {
      checkLoginIframe: false,
      onLoad: 'login-required',
      flow: 'standard',
    };

    // Only use PKCE in HTTPS environments
    if (window.location.protocol === 'https:') {
      initOptions.pkceMethod = 'S256';
    } else {
      console.warn('Running in HTTP mode - using standard flow without PKCE');
      initOptions.pkceMethod = null;
    }

    const auth = await kc.init(initOptions);

    if (auth) {
      return kc;
    } else {
      // This shouldn't happen with login-required, but just in case
      kc.login(loginOptions);
      return null;
    }
  } catch (err) {
    console.error('Keycloak initialization failed:', err);
    
    // If Web Crypto API error, try a fallback approach
    if (err.message.includes('Web Crypto API')) {
      console.log('Attempting fallback initialization without crypto...');
      try {
        const kc = getKeycloakInstance();
        
        // Force redirect to login immediately for HTTP environments
        const loginUrl = `${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/auth?client_id=${import.meta.env.VITE_SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SSO_REDIRECT_URI)}&response_type=code&scope=openid`;
        
        window.location.href = loginUrl;
        return null;
      } catch (fallbackErr) {
        console.error('Fallback initialization also failed:', fallbackErr);
        throw fallbackErr;
      }
    }
    
    throw err;
  }
};

export const logout = () => {
  const kc = getKeycloakInstance();
  kc.logout({
    redirectUri: import.meta.env.VITE_SSO_REDIRECT_URI
  });
};