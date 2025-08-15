export const initializeKeycloak = async () => {
  // Check if we're coming back from login
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    // Exchange code for token
    const response = await fetch(`${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: import.meta.env.VITE_SSO_CLIENT_ID,
        code: code,
        redirect_uri: import.meta.env.VITE_SSO_REDIRECT_URI,
      }),
    });
    
    if (response.ok) {
      const tokens = await response.json();
      localStorage.setItem('token', tokens.access_token);
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      return {
        authenticated: true,
        token: tokens.access_token,
        tokenParsed: JSON.parse(atob(tokens.access_token.split('.')[1])),
        idTokenParsed: tokens.id_token ? JSON.parse(atob(tokens.id_token.split('.')[1])) : null,
      };
    }
  }
  
  // Check stored token
  const token = localStorage.getItem('token');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp > Date.now() / 1000) {
      return {
        authenticated: true,
        token: token,
        tokenParsed: payload,
        idTokenParsed: payload,
      };
    }
  }
  
  // Redirect to login
  const loginUrl = `${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/auth?client_id=${import.meta.env.VITE_SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SSO_REDIRECT_URI)}&response_type=code&scope=openid`;
  window.location.href = loginUrl;
  return null;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = `${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(import.meta.env.VITE_SSO_REDIRECT_URI)}`;
};