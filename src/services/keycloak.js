export const initializeKeycloak = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    try {
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
        localStorage.setItem('access_token', tokens.access_token);
        window.history.replaceState({}, '', window.location.pathname);
        
        const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        const idTokenPayload = tokens.id_token ? JSON.parse(atob(tokens.id_token.split('.')[1])) : tokenPayload;
        
        return {
          authenticated: true,
          token: tokens.access_token,
          tokenParsed: tokenPayload,
          idTokenParsed: idTokenPayload,
        };
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  }
  
  const storedToken = localStorage.getItem('access_token');
  if (storedToken) {
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      if (payload.exp > Date.now() / 1000) {
        return {
          authenticated: true,
          token: storedToken,
          tokenParsed: payload,
          idTokenParsed: payload,
        };
      }
    } catch (error) {
      localStorage.removeItem('access_token');
    }
  }
  
  const loginUrl = `${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/auth?client_id=${import.meta.env.VITE_SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SSO_REDIRECT_URI)}&response_type=code&scope=openid`;
  window.location.href = loginUrl;
  return null;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  window.location.href = `${import.meta.env.VITE_SSO_AUTH_SERVER_URL}/realms/${import.meta.env.VITE_SSO_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(import.meta.env.VITE_SSO_REDIRECT_URI)}`;
};