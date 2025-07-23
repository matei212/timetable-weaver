import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Account created successfully! You can now log in.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMsg = (err as { message?: string }).message || "Sign up failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-16 bg-white rounded shadow flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
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
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          className="border rounded px-3 py-2 w-full"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded px-4 py-2 mt-2"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:underline font-semibold">Login</a>
      </div>
    </div>
  );
};

export default Signup; 