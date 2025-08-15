import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeKeycloak } from './services/keycloak';
import { createContext } from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home keycloak />,
  },
]);

export const AuthenticationContext = createContext('authentication');

function App() {
  const [keycloak, setKeycloak] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializationRef = useRef(false);

  const initKeycloak = useCallback(async () => {
    // Prevent multiple initializations
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      
      const _keycloak = await initializeKeycloak();
      setIsAuthenticated(_keycloak?.authenticated || false);
      setKeycloak(_keycloak);
    } catch (err) {
      console.error('Failed to initialize Keycloak:', err);
      setError('Failed to initialize authentication. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initKeycloak();
  }, [initKeycloak]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading authentication...</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Connecting to: {import.meta.env.VITE_SSO_AUTH_SERVER_URL}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        color: 'red'
      }}>
        <div>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '20px', padding: '10px 20px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Please log in to continue</div>
        <button 
          onClick={() => keycloak?.login()} 
          style={{ marginTop: '20px', padding: '10px 20px' }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <AuthenticationContext.Provider value={keycloak}>
      <RouterProvider router={router} />
    </AuthenticationContext.Provider>
  );
}

export default App;