import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import { useState, useEffect } from 'react';
import { initializeKeycloak } from './services/keycloak';
import { createContext } from 'react';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
]);

export const AuthenticationContext = createContext();

function App() {
  const [keycloak, setKeycloak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeKeycloak().then(kc => {
      if (kc) {
        setKeycloak(kc);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!keycloak?.authenticated) return <div>Redirecting to login...</div>;

  return (
    <AuthenticationContext.Provider value={keycloak}>
      <RouterProvider router={router} />
    </AuthenticationContext.Provider>
  );
}

export default App;