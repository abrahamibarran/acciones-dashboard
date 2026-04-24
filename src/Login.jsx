import { supabase } from "./supabaseClient";

const NAVY = "#012750";
const BLUE = "#245FA5";
const GRAD = `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`;

export default function Login({ error }) {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { hd: "numaris.com" },
      },
    });
    if (error) console.error("Login error:", error.message);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: GRAD,
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "52px 44px",
        boxShadow: "0 12px 40px rgba(0,0,0,.22)",
        textAlign: "center",
        maxWidth: 400,
        width: "90%",
      }}>
        <div style={{width:56,height:56,borderRadius:14,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 16px rgba(1,39,80,.2)"}}>
          <span style={{color:"#fff",fontSize:28,fontWeight:800}}>N</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, marginBottom: 2, letterSpacing: -.3 }}>
          Acciones CRM
        </div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 32 }}>
          Dashboard de Cobranza &mdash; Numaris
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 12,
            color: "#DC2626",
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "13px 20px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            color: "#333",
            cursor: "pointer",
            transition: "all .2s",
          }}
          onMouseOver={e => {e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.1)";e.currentTarget.style.borderColor="#d1d5db";}}
          onMouseOut={e => {e.currentTarget.style.boxShadow = "none";e.currentTarget.style.borderColor="#e5e7eb";}}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.97 23.97 0 000 24c0 3.77.9 7.35 2.56 10.54l7.97-5.95z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.95C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Iniciar sesión con Google
        </button>

        <div style={{ fontSize: 11, color: "#aaa", marginTop: 24 }}>
          Solo cuentas <strong style={{color:"#888"}}>@numaris.com</strong>
        </div>
      </div>
    </div>
  );
}
