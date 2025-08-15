import { useContext, useState } from 'react';
import { AuthenticationContext } from '../../App';
import { logout } from '../../services/keycloak';

const fetchRestictedContent = (token, setMessage) => {
    const serverURI = import.meta.env.VITE_SERVER_URI ?? 'http://localhost:8080' 
    setMessage('Request in flight...')
    fetch(`${serverURI}/restricted`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => res.text())
        .then(message => setMessage(message))
        .catch(() => setMessage(`Fetch failed. Ensure the rest API is running on ${serverURI}.`))
}

function Home() {
    const keycloak = useContext(AuthenticationContext);
    const [message, setMessage] = useState(null);

    return (
        <>
            {keycloak?.authenticated && (
                <>
                    <div>
                        <h2>Welcome! You are logged in.</h2>
                        <p>User: {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email || 'User'}</p>
                        <button onClick={() => logout()}>logout</button>
                    </div>

                    <div>
                        <h2>Test Rest API</h2>
                        <button onClick={() => fetchRestictedContent(keycloak.token, setMessage)}>Fetch Restricted Content</button>
                    </div>

                    {message && (
                        <p>{message}</p>
                    )}
                </>
            )}
        </>
    );
}

export default Home;