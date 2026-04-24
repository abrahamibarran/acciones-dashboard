import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import AccionesClientes from './AccionesClientes.jsx'
import Login from './Login.jsx'
import { supabase } from './supabaseClient.js'

const ALLOWED_DOMAIN = "numaris.com";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const email = session.user?.email || "";
        if (email.endsWith("@" + ALLOWED_DOMAIN)) {
          setSession(session);
        } else {
          setAuthError("Acceso restringido a cuentas @" + ALLOWED_DOMAIN);
          supabase.auth.signOut();
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const email = session.user?.email || "";
        if (email.endsWith("@" + ALLOWED_DOMAIN)) {
          setSession(session);
          setAuthError(null);
        } else {
          setAuthError("Acceso restringido a cuentas @" + ALLOWED_DOMAIN);
          supabase.auth.signOut();
          setSession(null);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #012750 0%, #245FA5 100%)",
        color: "#fff",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: .3,
      }}>
        Verificando sesión...
      </div>
    );
  }

  if (!session) {
    return <Login error={authError} />;
  }

  return (
    <AccionesClientes
      userEmail={session.user.email}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
