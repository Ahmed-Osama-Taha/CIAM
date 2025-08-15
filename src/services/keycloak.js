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

    // For HTTP environments, disable PKCE to avoid Web Crypto API requirement
    const initOptions = {
      checkLoginIframe: false,
      onLoad: 'check-sso',
    };

    // Only use PKCE in HTTPS environments
    if (window.location.protocol === 'https:') {
      initOptions.pkceMethod = 'S256';
    } else {
      console.warn('Running in HTTP mode - PKCE disabled for compatibility');
    }

    const auth = await kc.init(initOptions);

    if (auth) {
      return kc;
    } else {
      kc.login(loginOptions);
    }
  } catch (err) {
    console.error('Keycloak initialization failed:', err);
    throw err;
  }
};

export const logout = () => {
  const kc = getKeycloakInstance();
  kc.logout({
    redirectUri: import.meta.env.VITE_SSO_REDIRECT_URI
  });
};