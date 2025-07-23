import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess("Logged in successfully!");
    } catch (err) {
      const errorMsg = (err as { message?: string }).message || "Login failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    setSuccess("");
    try {
      await signOut(auth);
    } catch (err) {
      const errorMsg = (err as { message?: string }).message || "Logout failed";
      setError(errorMsg);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-16 bg-white rounded shadow flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          required
          className="border rounded px-3 py-2 w-full"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="border rounded px-3 py-2 w-full"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded px-4 py-2 mt-2"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-blue-500 hover:underline font-semibold">Sign up</a>
      </div>
      {user && (
        <div className="mt-8 w-full flex flex-col items-center">
          <div className="mb-2 text-green-700 font-semibold">Logged in as {user.email}</div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded px-4 py-2"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default Login; 