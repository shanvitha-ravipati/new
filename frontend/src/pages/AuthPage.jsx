import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, Backpack, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { auth } from "../firebase";

function readableAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a while and try again.",
    "auth/network-request-failed": "Could not reach Firebase. Check your internet connection.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase Authentication."
  };
  return messages[error.code] || "Authentication failed. Check your details and try again.";
}

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (authError) {
      setError(readableAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/" aria-label="Smart Bag home">
          <span className="brand-icon"><Backpack size={23} /></span>
          <span><strong>Smart Bag</strong><small>MONITORING SYSTEM</small></span>
        </a>

        <div className="auth-intro">
          <span className="eyebrow">YOUR BAG, YOUR DATA</span>
          <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
          <p>{isSignUp ? "Create an account to access your Smart Bag dashboard." : "Sign in to view your Smart Bag dashboard."}</p>
        </div>

        {error && <div className="auth-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={17} />
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={17} />
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} required />
          </div>
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? <><LoaderCircle size={17} className="spin" /> {isSignUp ? "Creating account..." : "Signing in..."}</> : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? "Already have an account?" : "New to Smart Bag?"}{" "}
          <button type="button" onClick={() => changeMode(isSignUp ? "signin" : "signup")}>
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
        <p className="auth-note">Dashboard readings are saved in this browser under your account ID.</p>
      </section>
    </main>
  );
}
