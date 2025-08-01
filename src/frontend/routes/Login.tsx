import React, { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email before logging in.");
        setShowResend(true);
        return;
      }
      setSuccess("Logged in successfully!");
    } catch (err) {
      const errorMsg = (err as { message?: string }).message || "Login failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        console.log("Resending verification email to:", user.email);
        await sendEmailVerification(user);
        console.log("Verification email resent successfully");
        setSuccess("Verification email sent!");
        setError("");
      } else {
        console.log("No current user found");
        setError("No user found. Please sign in first.");
      }
    } catch (err) {
      console.error("Error resending verification email:", err);
      setError("Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess("Logged in with Google!");
    } catch (err) {
      const errorMsg =
        (err as { message?: string }).message || "Google login failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await signOut(auth);
      setSuccess("");
    } catch (err) {
      const errorMsg = (err as { message?: string }).message || "Logout failed";
      setError(errorMsg);
    }
  };

  useEffect(() => {
    console.log(auth.currentUser);
  })

  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center rounded bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          required
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="mt-2 rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {showResend && (
          <button
            type="button"
            onClick={handleResendVerification}
            className="mt-2 rounded bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600"
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>
        )}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            aria-label="Sign in with Google"
            className="border-google-button-border-light flex items-center rounded-md border bg-white p-0.5 pr-3"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-l bg-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <title>Sign in with Google</title>
                <desc>Google G Logo</desc>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="fill-google-logo-blue"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="fill-google-logo-green"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  className="fill-google-logo-yellow"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  className="fill-google-logo-red"
                />
              </svg>
            </div>
            <span className="text-google-text-gray text-sm tracking-wider">
              Sign in with Google
            </span>
          </button>
        </div>
        {error && (
          <div className="text-center text-sm text-red-500">{error}</div>
        )}
        {success && (
          <div className="text-center text-sm text-green-600">{success}</div>
        )}
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-blue-500 hover:underline"
        >
          Sign up
        </Link>
      </div>
      {auth.currentUser && (
        <div className="mt-8 flex w-full flex-col items-center">
          <div className="mb-2 font-semibold text-green-700">
            Logged in as {auth.currentUser.email}
          </div>
          <button
            onClick={handleLogout}
            className="rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
