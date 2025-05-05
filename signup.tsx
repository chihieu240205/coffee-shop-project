// pages/signup.tsx
"use client";

import { useState } from "react";
import { signupEmployee } from "../services/auth";
import api from "../services/api";
import { useRouter } from "next/router";

export default function SignupPage() {
  const [ssn, setSsn] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ssn,
        name,
        email,
        salary: parseFloat(salary),
        password,
      };
      const { access_token } = await signupEmployee(payload);
      // store token and redirect
      localStorage.setItem("token", access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      router.push("/");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-brown rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Employee Sign Up</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SSN */}
        <div>
          <label htmlFor="ssn" className="block mb-1 font-medium">SSN</label>
          <input
            id="ssn"
            name="ssn"
            type="text"
            placeholder="123-45-6789"
            value={ssn}
            onChange={e => setSsn(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Salary */}
        <div>
          <label htmlFor="salary" className="block mb-1 font-medium">Salary</label>
          <input
            id="salary"
            name="salary"
            type="number"
            placeholder="50000"
            value={salary}
            onChange={e => setSalary(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        
        <button
          type="submit"
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
