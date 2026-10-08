import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { AlertCircle, Backpack, LoaderCircle } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import { auth, firebaseConfigured } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setCheckingAuth(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
  }, []);

  if (!firebaseConfigured) {
    return (
      <main className="auth-page">
        <section className="auth-card setup-card">
          <span className="brand-icon"><Backpack size={23} /></span>
          <h1>Firebase setup needed</h1>
          <p>Copy <code>frontend/.env.example</code> to <code>frontend/.env</code>, add your Firebase web app values, then restart Vite.</p>
          <div className="auth-error setup-error"><AlertCircle size={16} /><span>Firebase Authentication is not configured yet.</span></div>
        </section>
      </main>
    );
  }

  if (checkingAuth) {
    return <main className="auth-page"><div className="auth-loading"><LoaderCircle size={22} className="spin" />Checking sign-in...</div></main>;
  }
  return user ? <Dashboard user={user} /> : <AuthPage />;
}
